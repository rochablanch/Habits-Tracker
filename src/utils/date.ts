/** Convierte una fecha a texto ISO de solo día, ej. "2026-07-28". Se usa como clave de fecha en toda la app. */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** 0 = domingo … 6 = sábado, igual que Date.getDay(). */
export function isoWeekday(fecha: string): number {
  const [year, month, day] = fecha.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}

/** Suma (o resta, con cantidad negativa) días a una fecha "YYYY-MM-DD". */
export function sumarDias(fecha: string, cantidad: number): string {
  const [year, month, day] = fecha.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() + cantidad)
  return toISODate(d)
}

/** Cantidad de días entre dos fechas "YYYY-MM-DD" (ambas incluidas). */
export function diasEntre(desde: string, hasta: string): number {
  const [y1, m1, d1] = desde.split('-').map(Number)
  const [y2, m2, d2] = hasta.split('-').map(Number)
  const ms = new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()
  return Math.round(ms / 86_400_000) + 1
}

/** Todas las fechas "YYYY-MM-DD" entre desde y hasta, ambas incluidas. */
export function rangoDeFechas(desde: string, hasta: string): string[] {
  const fechas: string[] = []
  let cursor = desde
  while (cursor <= hasta) {
    fechas.push(cursor)
    cursor = sumarDias(cursor, 1)
  }
  return fechas
}

export type FormatoFecha = 'DD/MM/YYYY' | 'MM/DD/YYYY'

/** Convierte "YYYY-MM-DD" al formato corto elegido en Configuración, ej. "28/07/2026". */
export function formatearFechaCorta(fecha: string, formato: FormatoFecha): string {
  const [anio, mes, dia] = fecha.split('-')
  return formato === 'MM/DD/YYYY' ? `${mes}/${dia}/${anio}` : `${dia}/${mes}/${anio}`
}
