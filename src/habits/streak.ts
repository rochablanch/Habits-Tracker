import type { Habito, RegistroDiario } from '../db/types'
import { sumarDias, todayISO } from '../utils/date'
import { aplicaEnFecha, seCumplioEnFecha } from './dailyStatus'

/** Lunes de la semana ISO (semana empieza el lunes) a la que pertenece la fecha dada. */
export function lunesDeLaSemana(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number)
  const diaSemana = new Date(year, month - 1, day).getDay() // 0 = domingo
  const offset = diaSemana === 0 ? 6 : diaSemana - 1
  return sumarDias(fecha, -offset)
}

/**
 * Racha actual de un hábito: días (o semanas, para "x veces por semana") consecutivos
 * cumplidos, contando hacia atrás desde hoy. Los días no aplicables (ej. un hábito de
 * "lunes, miércoles y viernes" en un martes) no rompen la racha, simplemente se saltan.
 * Si hoy todavía no se marcó, no rompe la racha: se empieza a contar desde ayer.
 */
export function calcularRachaActual(
  habito: Habito,
  registros: RegistroDiario[],
  hoy: string = todayISO(),
): number {
  if (habito.frecuencia === 'x_veces_semana') {
    return rachaActualPorSemanas(habito, registros, hoy)
  }

  const registrosPorFecha = new Map(registros.map((r) => [r.fecha, r]))
  let racha = 0
  let cursor = hoy

  // Si hoy es aplicable pero todavía no está logrado, no cuenta como "roto": empezamos desde ayer.
  if (aplicaEnFecha(habito, cursor) && !seCumplioEnFecha(habito, registrosPorFecha.get(cursor))) {
    cursor = sumarDias(cursor, -1)
  }

  while (cursor >= habito.fechaInicio) {
    if (!aplicaEnFecha(habito, cursor)) {
      cursor = sumarDias(cursor, -1)
      continue
    }
    if (seCumplioEnFecha(habito, registrosPorFecha.get(cursor))) {
      racha++
      cursor = sumarDias(cursor, -1)
    } else {
      break
    }
  }

  return racha
}

function cumplidosEnSemana(
  habito: Habito,
  registrosPorFecha: Map<string, RegistroDiario>,
  lunes: string,
  limite: string,
): number {
  let cumplidos = 0
  let dia = lunes
  for (let i = 0; i < 7; i++) {
    if (dia >= habito.fechaInicio && dia <= limite && seCumplioEnFecha(habito, registrosPorFecha.get(dia))) {
      cumplidos++
    }
    dia = sumarDias(dia, 1)
  }
  return cumplidos
}

function rachaActualPorSemanas(habito: Habito, registros: RegistroDiario[], hoy: string): number {
  const meta = habito.vecesPorSemana ?? 1
  const registrosPorFecha = new Map(registros.map((r) => [r.fecha, r]))

  let racha = 0
  let semana = lunesDeLaSemana(hoy)

  // La semana actual (incompleta) no rompe la racha si todavía no llegó a la meta: se ignora y se empieza desde la anterior.
  if (cumplidosEnSemana(habito, registrosPorFecha, semana, hoy) < meta) {
    semana = sumarDias(semana, -7)
  }

  while (semana >= lunesDeLaSemana(habito.fechaInicio)) {
    if (cumplidosEnSemana(habito, registrosPorFecha, semana, hoy) >= meta) {
      racha++
      semana = sumarDias(semana, -7)
    } else {
      break
    }
  }

  return racha
}

/**
 * Racha máxima histórica: la racha más larga que el hábito tuvo alguna vez,
 * no solo la actual. Recorre todo el historial desde su fecha de inicio.
 */
export function calcularRachaMaxima(
  habito: Habito,
  registros: RegistroDiario[],
  hoy: string = todayISO(),
): number {
  if (habito.frecuencia === 'x_veces_semana') {
    return rachaMaximaPorSemanas(habito, registros, hoy)
  }

  const registrosPorFecha = new Map(registros.map((r) => [r.fecha, r]))
  let maxima = 0
  let actual = 0
  let cursor = habito.fechaInicio

  while (cursor <= hoy) {
    if (aplicaEnFecha(habito, cursor)) {
      if (seCumplioEnFecha(habito, registrosPorFecha.get(cursor))) {
        actual++
        if (actual > maxima) maxima = actual
      } else {
        actual = 0
      }
    }
    cursor = sumarDias(cursor, 1)
  }

  return maxima
}

function rachaMaximaPorSemanas(habito: Habito, registros: RegistroDiario[], hoy: string): number {
  const meta = habito.vecesPorSemana ?? 1
  const registrosPorFecha = new Map(registros.map((r) => [r.fecha, r]))

  // La semana actual, si todavía está incompleta y no llegó a la meta, no cuenta como
  // "fallada": se excluye del recorrido en vez de cortar una racha que sigue en curso.
  const semanaActual = lunesDeLaSemana(hoy)
  const semanaActualCumplida = cumplidosEnSemana(habito, registrosPorFecha, semanaActual, hoy) >= meta
  const ultimaSemana = semanaActualCumplida ? semanaActual : sumarDias(semanaActual, -7)

  let maxima = 0
  let actual = 0
  let semana = lunesDeLaSemana(habito.fechaInicio)

  while (semana <= ultimaSemana) {
    if (cumplidosEnSemana(habito, registrosPorFecha, semana, hoy) >= meta) {
      actual++
      if (actual > maxima) maxima = actual
    } else {
      actual = 0
    }
    semana = sumarDias(semana, 7)
  }

  return maxima
}
