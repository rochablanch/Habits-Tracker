import type { Habito } from '../db/types'
import { aplicaEnFecha } from '../habits/dailyStatus'

const CLAVE_DESCARTES = 'habitos-tracker-recordatorios-descartados'

/** Hora local actual en formato "HH:mm" (comparable como texto con `horaPreferida`). */
export function horaActualHHMM(fecha: Date = new Date()): string {
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}

/**
 * Hábitos que corresponde recordar en este momento.
 *
 * A propósito la condición es "la hora preferida ya llegó o ya pasó" (`<=`) y no
 * "es exactamente este minuto": la app puede estar cerrada, en segundo plano o con
 * los temporizadores frenados por el navegador justo en ese minuto, y en ese caso un
 * recordatorio de coincidencia exacta no se muestra nunca. El aviso queda pendiente
 * hasta que el hábito se registre, se descarte, o termine el día.
 */
export function recordatoriosPendientes(params: {
  habitos: Habito[]
  registradosHoy: Set<number>
  fecha: string
  horaActual: string
  descartados: number[]
}): Habito[] {
  const { habitos, registradosHoy, fecha, horaActual, descartados } = params
  return habitos.filter(
    (h) =>
      h.recordatorio &&
      Boolean(h.horaPreferida) &&
      h.horaPreferida! <= horaActual &&
      aplicaEnFecha(h, fecha) &&
      !registradosHoy.has(h.id) &&
      !descartados.includes(h.id),
  )
}

/** Minutos transcurridos entre dos horas "HH:mm" del mismo día. */
export function minutosDesde(horaPreferida: string, horaActual: string): number {
  const aMinutos = (hora: string) => {
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
  }
  return aMinutos(horaActual) - aMinutos(horaPreferida)
}

/**
 * Los avisos descartados se guardan en localStorage (información de este dispositivo,
 * no de la app — mismo criterio que el tema) junto con la fecha: al cambiar el día,
 * los descartes de ayer dejan de aplicar solos.
 */
export function leerDescartes(fecha: string): number[] {
  try {
    const crudo = localStorage.getItem(CLAVE_DESCARTES)
    if (!crudo) return []
    const guardado = JSON.parse(crudo) as { fecha?: string; ids?: unknown }
    if (guardado?.fecha !== fecha || !Array.isArray(guardado.ids)) return []
    return guardado.ids.filter((id): id is number => typeof id === 'number')
  } catch {
    return []
  }
}

export function guardarDescartes(fecha: string, ids: number[]): void {
  try {
    localStorage.setItem(CLAVE_DESCARTES, JSON.stringify({ fecha, ids }))
  } catch {
    // Sin localStorage (modo privado, permisos): el descarte vale solo mientras la app esté abierta.
  }
}
