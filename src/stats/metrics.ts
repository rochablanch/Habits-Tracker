import type { Categoria, Habito, RegistroDiario } from '../db/types'
import { calcularResumenDia, indexarRegistrosPorHabitoYFecha } from '../habits/summary'
import { aplicaEnFecha, seCumplioEnFecha } from '../habits/dailyStatus'
import { lunesDeLaSemana } from '../habits/streak'
import { isoWeekday, rangoDeFechas } from '../utils/date'
import { anioMesDeFecha } from '../calendar/monthGrid'
import type { RangoFechas } from './period'

/** Con menos días aplicables que esto, un porcentaje o tendencia no es confiable todavía. */
export const UMBRAL_DATOS_MINIMOS = 7

export function hayDatosSuficientes(aplicables: number): boolean {
  return aplicables >= UMBRAL_DATOS_MINIMOS
}

export interface CumplimientoResumen {
  aplicables: number
  logrados: number
  porcentaje: number | null
}

function porcentajeDe(aplicables: number, logrados: number): number | null {
  return aplicables === 0 ? null : Math.round((logrados / aplicables) * 100)
}

function cumplimientoDeHabitoEnFechas(
  habito: Habito,
  registrosPorClave: Map<string, RegistroDiario>,
  fechas: string[],
): CumplimientoResumen {
  let aplicables = 0
  let logrados = 0
  for (const fecha of fechas) {
    if (!aplicaEnFecha(habito, fecha)) continue
    aplicables++
    if (seCumplioEnFecha(habito, registrosPorClave.get(`${habito.id}|${fecha}`))) logrados++
  }
  return { aplicables, logrados, porcentaje: porcentajeDe(aplicables, logrados) }
}

export interface CumplimientoHabito extends CumplimientoResumen {
  habito: Habito
}

/** Cumplimiento de cada hábito en el rango, sin ordenar. */
export function cumplimientoPorHabito(
  habitos: Habito[],
  registros: RegistroDiario[],
  rango: RangoFechas,
): CumplimientoHabito[] {
  const registrosPorClave = indexarRegistrosPorHabitoYFecha(registros)
  const fechas = rangoDeFechas(rango.desde, rango.hasta)
  return habitos.map((habito) => ({
    habito,
    ...cumplimientoDeHabitoEnFechas(habito, registrosPorClave, fechas),
  }))
}

/** Cumplimiento total del rango: todos los hábitos, todos los días. */
export function cumplimientoEnRango(
  habitos: Habito[],
  registros: RegistroDiario[],
  rango: RangoFechas,
): CumplimientoResumen {
  const porHabito = cumplimientoPorHabito(habitos, registros, rango)
  const aplicables = porHabito.reduce((acc, h) => acc + h.aplicables, 0)
  const logrados = porHabito.reduce((acc, h) => acc + h.logrados, 0)
  return { aplicables, logrados, porcentaje: porcentajeDe(aplicables, logrados) }
}

export interface CumplimientoCategoria extends CumplimientoResumen {
  categoria: Categoria | null
}

/** Cumplimiento agrupado por categoría (null = "Sin categoría"), ordenado de mayor a menor. */
export function cumplimientoPorCategoria(
  habitos: Habito[],
  categorias: Categoria[],
  registros: RegistroDiario[],
  rango: RangoFechas,
): CumplimientoCategoria[] {
  const categoriasPorId = new Map(categorias.map((c) => [c.id, c]))
  const acumulado = new Map<number | null, { aplicables: number; logrados: number }>()

  for (const { habito, aplicables, logrados } of cumplimientoPorHabito(habitos, registros, rango)) {
    const clave = habito.categoriaId
    const actual = acumulado.get(clave) ?? { aplicables: 0, logrados: 0 }
    actual.aplicables += aplicables
    actual.logrados += logrados
    acumulado.set(clave, actual)
  }

  return [...acumulado.entries()]
    .map(([categoriaId, v]) => ({
      categoria: categoriaId === null ? null : (categoriasPorId.get(categoriaId) ?? null),
      aplicables: v.aplicables,
      logrados: v.logrados,
      porcentaje: porcentajeDe(v.aplicables, v.logrados),
    }))
    .filter((c) => c.aplicables > 0)
    .sort((a, b) => (b.porcentaje ?? -1) - (a.porcentaje ?? -1))
}

export interface PuntoEvolucion {
  /** Fecha del lunes (semanal) o "YYYY-MM" (mensual) que identifica el punto. */
  clave: string
  aplicables: number
  logrados: number
  porcentaje: number | null
}

function agruparYCalcular(
  habitos: Habito[],
  registrosPorClave: Map<string, RegistroDiario>,
  fechasPorClave: Map<string, string[]>,
): PuntoEvolucion[] {
  return [...fechasPorClave.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, fechas]) => {
      let aplicables = 0
      let logrados = 0
      for (const fecha of fechas) {
        const r = calcularResumenDia(habitos, registrosPorClave, fecha)
        aplicables += r.aplicables
        logrados += r.logrados
      }
      return { clave, aplicables, logrados, porcentaje: porcentajeDe(aplicables, logrados) }
    })
}

/** Cumplimiento agrupado por semana (identificada por el lunes con que empieza). */
export function evolucionSemanal(
  habitos: Habito[],
  registros: RegistroDiario[],
  rango: RangoFechas,
): PuntoEvolucion[] {
  const registrosPorClave = indexarRegistrosPorHabitoYFecha(registros)
  const fechasPorClave = new Map<string, string[]>()
  for (const fecha of rangoDeFechas(rango.desde, rango.hasta)) {
    const lunes = lunesDeLaSemana(fecha)
    fechasPorClave.set(lunes, [...(fechasPorClave.get(lunes) ?? []), fecha])
  }
  return agruparYCalcular(habitos, registrosPorClave, fechasPorClave)
}

/** Cumplimiento agrupado por mes ("YYYY-MM"). */
export function evolucionMensual(
  habitos: Habito[],
  registros: RegistroDiario[],
  rango: RangoFechas,
): PuntoEvolucion[] {
  const registrosPorClave = indexarRegistrosPorHabitoYFecha(registros)
  const fechasPorClave = new Map<string, string[]>()
  for (const fecha of rangoDeFechas(rango.desde, rango.hasta)) {
    const mes = anioMesDeFecha(fecha)
    fechasPorClave.set(mes, [...(fechasPorClave.get(mes) ?? []), fecha])
  }
  return agruparYCalcular(habitos, registrosPorClave, fechasPorClave)
}

export interface CumplimientoDiaSemana extends CumplimientoResumen {
  /** 0 = domingo … 6 = sábado, igual que Date.getDay(). */
  diaSemana: number
}

/** Cumplimiento agrupado por día de la semana, para encontrar el mejor (y peor) día. */
export function cumplimientoPorDiaSemana(
  habitos: Habito[],
  registros: RegistroDiario[],
  rango: RangoFechas,
): CumplimientoDiaSemana[] {
  const registrosPorClave = indexarRegistrosPorHabitoYFecha(registros)
  const acumulado = Array.from({ length: 7 }, () => ({ aplicables: 0, logrados: 0 }))

  for (const fecha of rangoDeFechas(rango.desde, rango.hasta)) {
    const r = calcularResumenDia(habitos, registrosPorClave, fecha)
    const dia = isoWeekday(fecha)
    acumulado[dia].aplicables += r.aplicables
    acumulado[dia].logrados += r.logrados
  }

  return acumulado.map((v, diaSemana) => ({
    diaSemana,
    aplicables: v.aplicables,
    logrados: v.logrados,
    porcentaje: porcentajeDe(v.aplicables, v.logrados),
  }))
}

/** Cantidad de días "perfectos": todos los hábitos aplicables de ese día se cumplieron. */
export function diasPerfectos(habitos: Habito[], registros: RegistroDiario[], rango: RangoFechas): number {
  const registrosPorClave = indexarRegistrosPorHabitoYFecha(registros)
  let contador = 0
  for (const fecha of rangoDeFechas(rango.desde, rango.hasta)) {
    const r = calcularResumenDia(habitos, registrosPorClave, fecha)
    if (r.aplicables > 0 && r.porcentaje === 100) contador++
  }
  return contador
}
