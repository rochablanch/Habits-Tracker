import type { ResumenDia } from '../habits/summary'

export type EstadoCeldaDia = 'futuro' | 'sin_habitos' | 'completo' | 'parcial' | 'sin_registros'

export function estadoCeldaDia(resumen: ResumenDia, hoy: string): EstadoCeldaDia {
  if (resumen.fecha > hoy) return 'futuro'
  if (resumen.aplicables === 0 || resumen.porcentaje === null) return 'sin_habitos'
  if (resumen.porcentaje >= 100) return 'completo'
  if (resumen.porcentaje > 0) return 'parcial'
  return 'sin_registros'
}
