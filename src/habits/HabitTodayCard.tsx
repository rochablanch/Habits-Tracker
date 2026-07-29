import { Check, Flame, Minus, MessageSquare, Plus, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useHistorialHabito } from '../db/hooks'
import { incrementarRegistro, quitarRegistro, registrarCumplimiento } from '../db/logsRepo'
import type { Habito } from '../db/types'
import { TextPromptDialog } from '../components/TextPromptDialog'
import { estadoVisualDia, metaDelDia, unidadDia, usaContador } from './dailyStatus'
import { obtenerIcono } from './icons'
import { calcularRachaActual } from './streak'

interface HabitTodayCardProps {
  habito: Habito
  fecha: string
}

const ESTILOS_ESTADO: Record<string, string> = {
  pendiente: 'border-slate-200 dark:border-slate-800',
  logrado: 'border-emerald-300 dark:border-emerald-800',
  parcial: 'border-amber-300 dark:border-amber-800',
  excedido: 'border-red-300 dark:border-red-800',
  omitido: 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50',
}

export function HabitTodayCard({ habito, fecha }: HabitTodayCardProps) {
  const historial = useHistorialHabito(habito.id)
  const [omitirAbierto, setOmitirAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [notaAbierta, setNotaAbierta] = useState(false)
  const [notaTexto, setNotaTexto] = useState('')

  const registroHoy = historial?.find((r) => r.fecha === fecha)
  const estado = estadoVisualDia(habito, registroHoy)
  const esContador = usaContador(habito)
  const meta = metaDelDia(habito)
  const unidad = unidadDia(habito)
  const racha = useMemo(
    () => (historial ? calcularRachaActual(habito, historial, fecha) : 0),
    [historial, habito, fecha],
  )

  const Icon = obtenerIcono(habito.icono)

  async function alternarSimple() {
    if (registroHoy && registroHoy.estado === 'completado') {
      await quitarRegistro(habito.id, fecha)
    } else {
      await registrarCumplimiento(habito.id, fecha, { estado: 'completado' })
    }
  }

  async function incrementar() {
    await incrementarRegistro(habito.id, fecha, 1)
  }

  async function decrementar() {
    await incrementarRegistro(habito.id, fecha, -1)
  }

  function abrirOmitir() {
    setMotivo(registroHoy?.motivoOmision ?? '')
    setOmitirAbierto(true)
  }

  async function confirmarOmitir() {
    await registrarCumplimiento(habito.id, fecha, { estado: 'omitido', motivoOmision: motivo.trim() || undefined })
    setOmitirAbierto(false)
  }

  function abrirNota() {
    setNotaTexto(registroHoy?.nota ?? '')
    setNotaAbierta(true)
  }

  async function guardarNota() {
    if (!registroHoy) return
    await registrarCumplimiento(habito.id, fecha, {
      estado: registroHoy.estado,
      valor: registroHoy.valor,
      motivoOmision: registroHoy.motivoOmision,
      nota: notaTexto.trim() || undefined,
    })
    setNotaAbierta(false)
  }

  return (
    <li className={`rounded-2xl border bg-white p-4 dark:bg-slate-900 ${ESTILOS_ESTADO[estado]}`}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: habito.color }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">{habito.nombre}</h3>
          {racha > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {racha} {racha === 1 ? 'día seguido' : habito.frecuencia === 'x_veces_semana' ? (racha === 1 ? 'semana seguida' : 'semanas seguidas') : 'días seguidos'}
            </p>
          )}
        </div>

        {estado !== 'omitido' &&
          (esContador ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decrementar}
                disabled={!registroHoy}
                aria-label={`Restar ${habito.nombre}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 disabled:opacity-30 dark:border-slate-700 dark:text-slate-300"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-16 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                {registroHoy?.valor ?? 0}
                {meta !== undefined && ` / ${meta}`}
                {unidad && <span className="block text-xs text-slate-400">{unidad}</span>}
              </span>
              <button
                type="button"
                onClick={incrementar}
                aria-label={`Sumar ${habito.nombre}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={alternarSimple}
              aria-pressed={estado === 'logrado'}
              aria-label={estado === 'logrado' ? `Desmarcar ${habito.nombre}` : `Marcar ${habito.nombre} como completado`}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                estado === 'logrado'
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 text-transparent hover:border-brand-400 dark:border-slate-700'
              }`}
            >
              <Check className="h-6 w-6" aria-hidden="true" />
            </button>
          ))}
      </div>

      {estado === 'omitido' && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm dark:bg-slate-950">
          <span className="text-slate-600 dark:text-slate-400">
            Omitido{registroHoy?.motivoOmision ? `: ${registroHoy.motivoOmision}` : ''}
          </span>
          <button
            type="button"
            onClick={() => quitarRegistro(habito.id, fecha)}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Deshacer
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-4 text-sm">
        {estado !== 'omitido' && (
          <button type="button" onClick={abrirOmitir} className="text-slate-500 hover:underline dark:text-slate-400">
            Omitir
          </button>
        )}
        <button
          type="button"
          onClick={abrirNota}
          disabled={!registroHoy}
          title={!registroHoy ? 'Marcá el hábito primero para poder agregar una nota.' : undefined}
          className="flex items-center gap-1 text-slate-500 hover:underline disabled:opacity-40 disabled:hover:no-underline dark:text-slate-400"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {registroHoy?.nota ? 'Editar nota' : 'Nota'}
        </button>
      </div>

      <TextPromptDialog
        open={omitirAbierto}
        title={`Omitir "${habito.nombre}"`}
        label="Motivo (opcional)"
        placeholder="Ej: estaba de viaje"
        value={motivo}
        onChange={setMotivo}
        confirmLabel="Omitir"
        onConfirm={confirmarOmitir}
        onCancel={() => setOmitirAbierto(false)}
      />

      <TextPromptDialog
        open={notaAbierta}
        title={`Nota para "${habito.nombre}"`}
        label="Nota"
        placeholder="Ej: me costó pero lo logré"
        value={notaTexto}
        onChange={setNotaTexto}
        confirmLabel="Guardar"
        onConfirm={guardarNota}
        onCancel={() => setNotaAbierta(false)}
      />
    </li>
  )
}
