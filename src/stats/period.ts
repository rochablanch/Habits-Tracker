import { diasEntre, sumarDias } from '../utils/date'

export type PeriodoId = '7d' | '30d' | '90d' | 'anio' | 'personalizado'

export interface RangoFechas {
  desde: string
  hasta: string
}

export const PERIODOS: { value: PeriodoId; label: string }[] = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'anio', label: 'Este año' },
  { value: 'personalizado', label: 'Rango personalizado' },
]

export function calcularRango(periodo: PeriodoId, hoy: string, personalizado?: RangoFechas): RangoFechas {
  switch (periodo) {
    case '7d':
      return { desde: sumarDias(hoy, -6), hasta: hoy }
    case '30d':
      return { desde: sumarDias(hoy, -29), hasta: hoy }
    case '90d':
      return { desde: sumarDias(hoy, -89), hasta: hoy }
    case 'anio':
      return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy }
    case 'personalizado':
      return personalizado ?? { desde: hoy, hasta: hoy }
  }
}

/** El período inmediatamente anterior, de la misma duración, para comparar. */
export function rangoAnterior(rango: RangoFechas): RangoFechas {
  const dias = diasEntre(rango.desde, rango.hasta)
  return {
    desde: sumarDias(rango.desde, -dias),
    hasta: sumarDias(rango.desde, -1),
  }
}
