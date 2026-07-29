import type { ResumenDia } from '../habits/summary'

export type EstadoCeldaDia = 'futuro' | 'sin_habitos' | 'completo' | 'parcial' | 'sin_registros'

export function estadoCeldaDia(resumen: ResumenDia, hoy: string): EstadoCeldaDia {
  if (resumen.fecha > hoy) return 'futuro'
  if (resumen.aplicables === 0 || resumen.porcentaje === null) return 'sin_habitos'
  if (resumen.porcentaje >= 100) return 'completo'
  if (resumen.porcentaje > 0) return 'parcial'
  return 'sin_registros'
}

/** Mismos colores en todas las vistas que muestran cumplimiento por día (Calendario, mapa de calor de Estadísticas). */
export const ESTILO_CELDA_DIA: Record<EstadoCeldaDia, string> = {
  futuro: 'bg-transparent text-slate-300 dark:text-slate-700',
  sin_habitos: 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600',
  completo: 'bg-emerald-500 text-white',
  parcial: 'bg-amber-400 text-white',
  sin_registros: 'bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
}

export const LEYENDA_CELDA_DIA: { estado: EstadoCeldaDia; label: string }[] = [
  { estado: 'completo', label: 'Completo' },
  { estado: 'parcial', label: 'Parcial' },
  { estado: 'sin_registros', label: 'Sin registros' },
  { estado: 'sin_habitos', label: 'Sin hábitos' },
  { estado: 'futuro', label: 'Futuro' },
]
