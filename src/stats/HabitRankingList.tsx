import { Flame, Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { useHistorialHabito } from '../db/hooks'
import { obtenerIcono } from '../habits/icons'
import { calcularRachaActual, calcularRachaMaxima } from '../habits/streak'
import { UMBRAL_DATOS_MINIMOS, hayDatosSuficientes, type CumplimientoHabito } from './metrics'

function HabitRankingRow({ item, hoy }: { item: CumplimientoHabito; hoy: string }) {
  const historial = useHistorialHabito(item.habito.id)
  const Icon = obtenerIcono(item.habito.icono)

  const rachas = useMemo(() => {
    if (!historial) return null
    return {
      actual: calcularRachaActual(item.habito, historial, hoy),
      maxima: calcularRachaMaxima(item.habito, historial, hoy),
    }
  }, [historial, item.habito, hoy])

  const suficiente = hayDatosSuficientes(item.aplicables)

  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: item.habito.color }}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-800 dark:text-slate-200">{item.habito.nombre}</p>
        {rachas && (rachas.actual > 0 || rachas.maxima > 0) && (
          <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-orange-500" aria-hidden="true" />
              {rachas.actual}
            </span>
            <span className="flex items-center gap-0.5">
              <Trophy className="h-3 w-3 text-amber-500" aria-hidden="true" />
              {rachas.maxima}
            </span>
          </p>
        )}
      </div>

      {suficiente ? (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.porcentaje}%</span>
      ) : (
        <span className="text-right text-xs text-slate-400" title={`Menos de ${UMBRAL_DATOS_MINIMOS} días con datos`}>
          Datos insuficientes
        </span>
      )}
    </li>
  )
}

export function HabitRankingList({ items, hoy }: { items: CumplimientoHabito[]; hoy: string }) {
  const ordenados = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.porcentaje === null) return 1
        if (b.porcentaje === null) return -1
        return b.porcentaje - a.porcentaje
      }),
    [items],
  )

  return (
    <ul className="flex flex-col gap-2">
      {ordenados.map((item) => (
        <HabitRankingRow key={item.habito.id} item={item} hoy={hoy} />
      ))}
    </ul>
  )
}
