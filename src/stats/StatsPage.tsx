import { BarChart3, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ProgressRing } from '../components/ProgressRing'
import { useCategorias, useHabitos, useRegistrosEnRango } from '../db/hooks'
import { todayISO } from '../utils/date'
import { CategoryBreakdown } from './CategoryBreakdown'
import { EvolutionChart } from './EvolutionChart'
import { HabitRankingList } from './HabitRankingList'
import { HeatmapCalendar } from './HeatmapCalendar'
import {
  cumplimientoEnRango,
  cumplimientoPorCategoria,
  cumplimientoPorDiaSemana,
  cumplimientoPorHabito,
  diasPerfectos,
  evolucionMensual,
  evolucionSemanal,
  hayDatosSuficientes,
} from './metrics'
import { calcularRango, rangoAnterior, type PeriodoId, type RangoFechas } from './period'
import { PeriodSelector } from './PeriodSelector'
import { WeekdayBreakdown } from './WeekdayBreakdown'

const NOMBRES_MES_CORTO = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

function formatearSemana(lunes: string): string {
  const dia = Number(lunes.slice(8, 10))
  const mes = Number(lunes.slice(5, 7)) - 1
  return `${dia} ${NOMBRES_MES_CORTO[mes]}`
}

function formatearMes(anioMes: string): string {
  const [anio, mes] = anioMes.split('-').map(Number)
  return `${NOMBRES_MES_CORTO[mes - 1]} ${anio}`
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{titulo}</h2>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </section>
  )
}

export function StatsPage() {
  const hoy = todayISO()
  const [periodo, setPeriodo] = useState<PeriodoId>('30d')
  const [personalizado, setPersonalizado] = useState<RangoFechas>(() => calcularRango('7d', hoy))

  const rango = useMemo(() => calcularRango(periodo, hoy, personalizado), [periodo, hoy, personalizado])
  const rangoPrevio = useMemo(() => rangoAnterior(rango), [rango])

  const habitos = useHabitos({ incluirEliminados: true })
  const categorias = useCategorias()
  const registros = useRegistrosEnRango(rango.desde, rango.hasta)
  const registrosPrevios = useRegistrosEnRango(rangoPrevio.desde, rangoPrevio.hasta)

  const cargando = !habitos || !categorias || !registros || !registrosPrevios

  const resumenTotal = useMemo(
    () => (habitos && registros ? cumplimientoEnRango(habitos, registros, rango) : null),
    [habitos, registros, rango],
  )
  const resumenPrevio = useMemo(
    () => (habitos && registrosPrevios ? cumplimientoEnRango(habitos, registrosPrevios, rangoPrevio) : null),
    [habitos, registrosPrevios, rangoPrevio],
  )
  const porHabito = useMemo(
    () => (habitos && registros ? cumplimientoPorHabito(habitos, registros, rango) : []),
    [habitos, registros, rango],
  )
  const porCategoria = useMemo(
    () => (habitos && categorias && registros ? cumplimientoPorCategoria(habitos, categorias, registros, rango) : []),
    [habitos, categorias, registros, rango],
  )
  const porDiaSemana = useMemo(
    () => (habitos && registros ? cumplimientoPorDiaSemana(habitos, registros, rango) : []),
    [habitos, registros, rango],
  )
  const semanal = useMemo(
    () => (habitos && registros ? evolucionSemanal(habitos, registros, rango) : []),
    [habitos, registros, rango],
  )
  const mensual = useMemo(
    () => (habitos && registros ? evolucionMensual(habitos, registros, rango) : []),
    [habitos, registros, rango],
  )
  const diasCompletados = useMemo(
    () => (habitos && registros ? diasPerfectos(habitos, registros, rango) : 0),
    [habitos, registros, rango],
  )

  const mejorHabito = [...porHabito]
    .filter((h) => hayDatosSuficientes(h.aplicables))
    .sort((a, b) => (b.porcentaje ?? 0) - (a.porcentaje ?? 0))[0]
  const peorHabito = [...porHabito]
    .filter((h) => hayDatosSuficientes(h.aplicables))
    .sort((a, b) => (a.porcentaje ?? 0) - (b.porcentaje ?? 0))[0]

  if (habitos && habitos.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={BarChart3}
          title="Todavía no tenés hábitos"
          description="Cuando crees hábitos y los registres, acá vas a ver tus estadísticas."
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
    <div className="mx-auto max-w-2xl px-4 py-6 pb-10">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Estadísticas</h1>

      <div className="mt-4">
        <PeriodSelector
          periodo={periodo}
          personalizado={personalizado}
          onCambiarPeriodo={setPeriodo}
          onCambiarPersonalizado={setPersonalizado}
        />
      </div>

      {cargando ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <ProgressRing
              porcentaje={resumenTotal?.porcentaje ?? 0}
              etiqueta={`${resumenTotal?.porcentaje ?? 0}% de cumplimiento total`}
            />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {resumenTotal?.porcentaje === null ? 'Sin datos' : `${resumenTotal?.porcentaje}% de cumplimiento`}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {resumenTotal?.logrados ?? 0} de {resumenTotal?.aplicables ?? 0} registros logrados
              </p>
              {resumenTotal && hayDatosSuficientes(resumenTotal.aplicables) && resumenPrevio?.porcentaje !== null && resumenTotal.porcentaje !== null && resumenPrevio && (
                <ComparacionPeriodo actual={resumenTotal.porcentaje} previo={resumenPrevio.porcentaje} />
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{diasCompletados}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Días perfectos</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {porHabito.filter((h) => h.aplicables > 0).length}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Hábitos con registros</p>
            </div>
          </div>

          {(mejorHabito || peorHabito) && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mejorHabito && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Mayor cumplimiento
                  </p>
                  <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{mejorHabito.habito.nombre}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{mejorHabito.porcentaje}%</p>
                </div>
              )}
              {peorHabito && peorHabito.habito.id !== mejorHabito?.habito.id && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Para mejorar
                  </p>
                  <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{peorHabito.habito.nombre}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{peorHabito.porcentaje}%</p>
                </div>
              )}
            </div>
          )}

          <Seccion titulo="Mapa de calor">
            <HeatmapCalendar habitos={habitos!} registros={registros!} rango={rango} hoy={hoy} />
          </Seccion>

          <Seccion titulo="Evolución semanal">
            {semanal.length < 2 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Elegí un período más largo para ver la evolución semana a semana.
              </p>
            ) : (
              <EvolutionChart datos={semanal} formatearEtiqueta={formatearSemana} />
            )}
          </Seccion>

          <Seccion titulo="Evolución mensual">
            {mensual.length < 2 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Elegí un período más largo para ver la evolución mes a mes.
              </p>
            ) : (
              <EvolutionChart datos={mensual} formatearEtiqueta={formatearMes} />
            )}
          </Seccion>

          <Seccion titulo="Cumplimiento por hábito">
            <HabitRankingList items={porHabito} hoy={hoy} />
          </Seccion>

          <Seccion titulo="Cumplimiento por categoría">
            <CategoryBreakdown items={porCategoria} />
          </Seccion>

          <Seccion titulo="Mejor día de la semana">
            <WeekdayBreakdown items={porDiaSemana} />
          </Seccion>
        </>
      )}
    </div>
  )
}

function ComparacionPeriodo({ actual, previo }: { actual: number; previo: number }) {
  const delta = actual - previo
  const Icono = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const color =
    delta > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : delta < 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-500 dark:text-slate-400'

  return (
    <p className={`mt-1 flex items-center gap-1 text-sm ${color}`}>
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      {delta === 0 ? 'Igual que el período anterior' : `${delta > 0 ? '+' : ''}${delta}% vs. período anterior`}
    </p>
  )
}
