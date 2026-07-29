import type { Habito, RegistroDiario } from '../db/types'
import { sumarDias } from '../utils/date'
import { aplicaEnFecha, seCumplioEnFecha } from './dailyStatus'

export interface ResumenDia {
  fecha: string
  aplicables: number
  logrados: number
  /** 0 a 100. null si ningún hábito aplicaba ese día (para no mostrar un 0% engañoso). */
  porcentaje: number | null
}

export function indexarRegistrosPorHabitoYFecha(registros: RegistroDiario[]): Map<string, RegistroDiario> {
  return new Map(registros.map((r) => [`${r.habitoId}|${r.fecha}`, r]))
}

/** Resumen de cumplimiento de un día puntual. `registrosPorClave` se arma una vez con `indexarRegistrosPorHabitoYFecha` para poder llamar esto muchas veces (ej. los ~35 días de un calendario) sin reconstruir el índice cada vez. */
export function calcularResumenDia(
  habitos: Habito[],
  registrosPorClave: Map<string, RegistroDiario>,
  fecha: string,
): ResumenDia {
  const habitosAplicables = habitos.filter((h) => aplicaEnFecha(h, fecha))
  const logrados = habitosAplicables.filter((h) =>
    seCumplioEnFecha(h, registrosPorClave.get(`${h.id}|${fecha}`)),
  ).length

  return {
    fecha,
    aplicables: habitosAplicables.length,
    logrados,
    porcentaje: habitosAplicables.length === 0 ? null : Math.round((logrados / habitosAplicables.length) * 100),
  }
}

/** Resumen de los últimos `dias` (incluyendo hoy), para el pequeño resumen semanal del panel. */
export function resumenUltimosDias(
  habitos: Habito[],
  registros: RegistroDiario[],
  hoy: string,
  dias = 7,
): ResumenDia[] {
  const registrosPorClave = indexarRegistrosPorHabitoYFecha(registros)
  const resultado: ResumenDia[] = []

  for (let i = dias - 1; i >= 0; i--) {
    resultado.push(calcularResumenDia(habitos, registrosPorClave, sumarDias(hoy, -i)))
  }

  return resultado
}
