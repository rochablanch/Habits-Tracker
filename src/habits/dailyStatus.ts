import type { Habito, RegistroDiario } from '../db/types'
import { isoWeekday } from '../utils/date'

/** ¿Este hábito corresponde marcarlo en esta fecha? (según su frecuencia y fecha de inicio) */
export function aplicaEnFecha(habito: Habito, fecha: string): boolean {
  if (fecha < habito.fechaInicio) return false
  if (habito.frecuencia === 'diaria') return true
  if (habito.frecuencia === 'dias_semana') return habito.diasSemana.includes(isoWeekday(fecha))
  return true // x_veces_semana: el usuario elige libremente qué días de la semana lo hace
}

/** Hábitos de tipo sí/no o evitar, hechos más de una vez por día, se tratan como un contador (ej: "3 de 3 veces"). */
export function usaContador(habito: Habito): boolean {
  if (habito.tipo === 'cantidad' || habito.tipo === 'tiempo' || habito.tipo === 'limite_maximo') return true
  return habito.vecesPorDia > 1
}

/** Meta numérica del día: la cantidad/minutos/límite, o las veces por día si aplica. undefined = simple sí/no. */
export function metaDelDia(habito: Habito): number | undefined {
  if (habito.tipo === 'cantidad' || habito.tipo === 'tiempo' || habito.tipo === 'limite_maximo') {
    return habito.metaCantidad
  }
  return habito.vecesPorDia > 1 ? habito.vecesPorDia : undefined
}

export function unidadDia(habito: Habito): string {
  if (habito.unidadMedida) return habito.unidadMedida
  return usaContador(habito) ? 'veces' : ''
}

export type EstadoVisualDia = 'pendiente' | 'logrado' | 'parcial' | 'excedido' | 'omitido'

export function estadoVisualDia(habito: Habito, registro: RegistroDiario | undefined): EstadoVisualDia {
  if (!registro) return 'pendiente'
  if (registro.estado === 'omitido') return 'omitido'

  if (habito.tipo === 'limite_maximo') {
    const meta = habito.metaCantidad
    if (meta === undefined) return 'logrado'
    return (registro.valor ?? 0) <= meta ? 'logrado' : 'excedido'
  }

  if (!usaContador(habito)) return 'logrado'

  const meta = metaDelDia(habito) ?? Infinity
  return (registro.valor ?? 0) >= meta ? 'logrado' : 'parcial'
}

export function seCumplioEnFecha(habito: Habito, registro: RegistroDiario | undefined): boolean {
  return estadoVisualDia(habito, registro) === 'logrado'
}
