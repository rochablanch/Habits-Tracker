import type { Habito, RegistroDiario } from '../db/types'
import { toISODate } from '../utils/date'
import { aplicaEnFecha, seCumplioEnFecha } from './dailyStatus'

export interface ResumenDia {
  fecha: string
  aplicables: number
  logrados: number
  /** 0 a 100. null si ningún hábito aplicaba ese día (para no mostrar un 0% engañoso). */
  porcentaje: number | null
}

function restarDias(fecha: string, cantidad: number): string {
  const [year, month, day] = fecha.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() - cantidad)
  return toISODate(d)
}

/** Resumen de los últimos `dias` (incluyendo hoy), para el pequeño resumen semanal del panel. */
export function resumenUltimosDias(
  habitos: Habito[],
  registros: RegistroDiario[],
  hoy: string,
  dias = 7,
): ResumenDia[] {
  const registrosPorClave = new Map(registros.map((r) => [`${r.habitoId}|${r.fecha}`, r]))
  const resultado: ResumenDia[] = []

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = restarDias(hoy, i)
    const habitosAplicables = habitos.filter((h) => aplicaEnFecha(h, fecha))
    const logrados = habitosAplicables.filter((h) =>
      seCumplioEnFecha(h, registrosPorClave.get(`${h.id}|${fecha}`)),
    ).length

    resultado.push({
      fecha,
      aplicables: habitosAplicables.length,
      logrados,
      porcentaje: habitosAplicables.length === 0 ? null : Math.round((logrados / habitosAplicables.length) * 100),
    })
  }

  return resultado
}
