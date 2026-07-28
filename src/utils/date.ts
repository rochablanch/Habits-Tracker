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
