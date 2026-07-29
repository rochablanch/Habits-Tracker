import { CalendarCheck, Quote } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ProgressRing } from '../components/ProgressRing'
import { useConfiguracion, useHabitos, useRegistrosEnRango } from '../db/hooks'
import type { RegistroDiario } from '../db/types'
import { aplicaEnFecha, seCumplioEnFecha } from '../habits/dailyStatus'
import { HabitTodayCard } from '../habits/HabitTodayCard'
import { resumenUltimosDias } from '../habits/summary'
import { WeeklySummary } from '../habits/WeeklySummary'
import { toISODate, todayISO } from '../utils/date'
import { fraseDelDia } from './motivationalQuotes'

const DIAS_RESUMEN = 7

function restarDias(fecha: string, cantidad: number): string {
  const [year, month, day] = fecha.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() - cantidad)
  return toISODate(d)
}

function saludo(): string {
  const hora = new Date().getHours()
  if (hora < 6) return 'Buenas noches'
  if (hora < 12) return 'Buenos días'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function PanelPage() {
  const hoy = todayISO()
  const desde = useMemo(() => restarDias(hoy, DIAS_RESUMEN - 1), [hoy])

  const habitosActivos = useHabitos({ estado: 'activo' })
  const registrosRecientes = useRegistrosEnRango(desde, hoy)
  const configuracion = useConfiguracion()

  const habitosDeHoy = useMemo(
    () => habitosActivos?.filter((h) => aplicaEnFecha(h, hoy)) ?? undefined,
    [habitosActivos, hoy],
  )

  const registrosHoyPorHabito = useMemo(() => {
    const mapa = new Map<number, RegistroDiario>()
    registrosRecientes?.filter((r) => r.fecha === hoy).forEach((r) => mapa.set(r.habitoId, r))
    return mapa
  }, [registrosRecientes, hoy])

  const logradosHoy = habitosDeHoy?.filter((h) => seCumplioEnFecha(h, registrosHoyPorHabito.get(h.id))).length ?? 0
  const porcentajeHoy = habitosDeHoy && habitosDeHoy.length > 0 ? Math.round((logradosHoy / habitosDeHoy.length) * 100) : 0

  const resumenSemanal = useMemo(
    () =>
      habitosActivos && registrosRecientes
        ? resumenUltimosDias(habitosActivos, registrosRecientes, hoy, DIAS_RESUMEN)
        : undefined,
    [habitosActivos, registrosRecientes, hoy],
  )

  const fechaFormateada = new Intl.DateTimeFormat('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const cargando = habitosDeHoy === undefined || resumenSemanal === undefined

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <p className="capitalize text-slate-500 dark:text-slate-400">{fechaFormateada}</p>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{saludo()}</h1>

      {configuracion?.frasesMotivacionales && (
        <p className="mt-2 flex items-start gap-1.5 text-sm italic text-slate-500 dark:text-slate-400">
          <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {fraseDelDia(hoy)}
        </p>
      )}

      {cargando ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      ) : habitosDeHoy!.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarCheck}
            title={
              habitosActivos && habitosActivos.length > 0
                ? 'Hoy no tenés hábitos programados'
                : 'Todavía no tenés hábitos'
            }
            description={
              habitosActivos && habitosActivos.length > 0
                ? 'Algunos de tus hábitos están programados para otros días de la semana.'
                : 'Creá tu primer hábito para empezar a registrar tu constancia.'
            }
            action={
              (!habitosActivos || habitosActivos.length === 0) && (
                <Link
                  to="/habitos/nuevo"
                  className="mt-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Crear hábito
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <ProgressRing porcentaje={porcentajeHoy} etiqueta={`${porcentajeHoy}% de hábitos completados hoy`} />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {logradosHoy} de {habitosDeHoy!.length} hábitos
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">completados hoy</p>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-3">
            {habitosDeHoy!.map((habito) => (
              <HabitTodayCard key={habito.id} habito={habito} fecha={hoy} />
            ))}
          </ul>

          <div className="mt-4">
            <WeeklySummary resumen={resumenSemanal!} />
          </div>
        </>
      )}
    </div>
  )
}
