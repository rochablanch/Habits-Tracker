import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { useConfiguracion, useHabitos, useRegistrosEnRango } from '../db/hooks'
import { aplicaEnFecha } from '../habits/dailyStatus'
import { HabitTodayCard } from '../habits/HabitTodayCard'
import { calcularResumenDia, indexarRegistrosPorHabitoYFecha } from '../habits/summary'
import { formatearFechaCorta, todayISO } from '../utils/date'
import { ESTILO_CELDA_DIA, LEYENDA_CELDA_DIA, estadoCeldaDia } from './dayCellStatus'
import { anioMesDeFecha, diasDelMesVisible, sumarMeses } from './monthGrid'

const NOMBRES_DIA_LUNES = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const NOMBRES_DIA_DOMINGO = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export function CalendarPage() {
  const hoy = todayISO()
  const [anioMes, setAnioMes] = useState(anioMesDeFecha(hoy))
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy)

  const configuracion = useConfiguracion()
  const primerDiaSemana = configuracion?.primerDiaSemana ?? 1
  const nombresDia = primerDiaSemana === 0 ? NOMBRES_DIA_DOMINGO : NOMBRES_DIA_LUNES

  const dias = useMemo(() => diasDelMesVisible(anioMes, primerDiaSemana), [anioMes, primerDiaSemana])
  const habitos = useHabitos({})
  const registros = useRegistrosEnRango(dias[0], dias[dias.length - 1])

  const registrosPorClave = useMemo(
    () => (registros ? indexarRegistrosPorHabitoYFecha(registros) : new Map()),
    [registros],
  )

  const resumenPorDia = useMemo(() => {
    if (!habitos) return undefined
    const mapa = new Map(dias.map((fecha) => [fecha, calcularResumenDia(habitos, registrosPorClave, fecha)]))
    return mapa
  }, [habitos, registrosPorClave, dias])

  const habitosDelDiaSeleccionado = useMemo(
    () => habitos?.filter((h) => aplicaEnFecha(h, fechaSeleccionada)) ?? [],
    [habitos, fechaSeleccionada],
  )

  const etiquetaMes = useMemo(() => {
    const [anio, mes] = anioMes.split('-').map(Number)
    return new Intl.DateTimeFormat('es-UY', { month: 'long', year: 'numeric' }).format(new Date(anio, mes - 1, 1))
  }, [anioMes])

  const etiquetaFechaSeleccionada = useMemo(() => {
    const [anio, mes, dia] = fechaSeleccionada.split('-').map(Number)
    return new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(anio, mes - 1, dia),
    )
  }, [fechaSeleccionada])

  if (habitos && habitos.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={CalendarDays}
          title="Todavía no tenés hábitos"
          description="Cuando crees hábitos, acá vas a poder ver tu historial mes a mes."
          action={
            <Link
              to="/habitos/nuevo"
              className="mt-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Crear hábito
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Calendario</h1>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setAnioMes((m) => sumarMeses(m, -1))}
          aria-label="Mes anterior"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="capitalize font-medium text-slate-800 dark:text-slate-200">{etiquetaMes}</span>
        <button
          type="button"
          onClick={() => setAnioMes((m) => sumarMeses(m, 1))}
          aria-label="Mes siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
        {nombresDia.map((n, i) => (
          <span key={i}>{n}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {dias.map((fecha) => {
          const resumen = resumenPorDia?.get(fecha)
          const estado = resumen ? estadoCeldaDia(resumen, hoy) : undefined
          const fueraDeMes = anioMesDeFecha(fecha) !== anioMes
          const esSeleccionado = fecha === fechaSeleccionada
          const dia = Number(fecha.slice(8, 10))

          return (
            <button
              key={fecha}
              type="button"
              onClick={() => setFechaSeleccionada(fecha)}
              aria-pressed={esSeleccionado}
              aria-label={fecha}
              className={`flex aspect-square items-center justify-center rounded-lg text-sm transition-opacity ${
                estado ? ESTILO_CELDA_DIA[estado] : 'bg-slate-50 dark:bg-slate-900'
              } ${fueraDeMes ? 'opacity-40' : ''} ${esSeleccionado ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950' : ''}`}
            >
              {dia}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        {LEYENDA_CELDA_DIA.map((item) => (
          <span key={item.estado} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${ESTILO_CELDA_DIA[item.estado].split(' ')[0]}`} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="flex items-baseline gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <span className="capitalize">{etiquetaFechaSeleccionada}</span>
          <span className="font-normal text-slate-400">
            {formatearFechaCorta(fechaSeleccionada, configuracion?.formatoFecha === 'MM/DD/YYYY' ? 'MM/DD/YYYY' : 'DD/MM/YYYY')}
          </span>
        </h2>

        {habitosDelDiaSeleccionado.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Ningún hábito estaba programado para este día.
          </p>
        ) : fechaSeleccionada > hoy ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Este día todavía no llegó.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {habitosDelDiaSeleccionado.map((habito) => (
              <HabitTodayCard key={habito.id} habito={habito} fecha={fechaSeleccionada} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
