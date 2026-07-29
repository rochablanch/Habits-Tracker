import { useMemo } from 'react'
import { ESTILO_CELDA_DIA, LEYENDA_CELDA_DIA, estadoCeldaDia } from '../calendar/dayCellStatus'
import type { Habito, RegistroDiario } from '../db/types'
import { calcularResumenDia, indexarRegistrosPorHabitoYFecha } from '../habits/summary'
import { lunesDeLaSemana } from '../habits/streak'
import { sumarDias } from '../utils/date'
import type { RangoFechas } from './period'

interface HeatmapCalendarProps {
  habitos: Habito[]
  registros: RegistroDiario[]
  rango: RangoFechas
  hoy: string
}

export function HeatmapCalendar({ habitos, registros, rango, hoy }: HeatmapCalendarProps) {
  const registrosPorClave = useMemo(() => indexarRegistrosPorHabitoYFecha(registros), [registros])

  const semanas = useMemo(() => {
    const columnas: string[][] = []
    let cursor = lunesDeLaSemana(rango.desde)
    while (cursor <= rango.hasta) {
      const semana: string[] = []
      for (let i = 0; i < 7; i++) {
        semana.push(cursor)
        cursor = sumarDias(cursor, 1)
      }
      columnas.push(semana)
    }
    return columnas
  }, [rango])

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1">
          {semanas.map((semana) => (
            <div key={semana[0]} className="flex flex-col gap-1">
              {semana.map((fecha) => {
                const dentroDeRango = fecha >= rango.desde && fecha <= rango.hasta
                if (!dentroDeRango) {
                  return <div key={fecha} className="h-3 w-3 rounded-sm bg-transparent" />
                }
                const resumen = calcularResumenDia(habitos, registrosPorClave, fecha)
                const estado = estadoCeldaDia(resumen, hoy)
                return (
                  <div
                    key={fecha}
                    title={`${fecha}: ${resumen.porcentaje === null ? 'sin hábitos' : `${resumen.porcentaje}%`}`}
                    className={`h-3 w-3 rounded-sm ${ESTILO_CELDA_DIA[estado].split(' ')[0]}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        {LEYENDA_CELDA_DIA.map((item) => (
          <span key={item.estado} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${ESTILO_CELDA_DIA[item.estado].split(' ')[0]}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
