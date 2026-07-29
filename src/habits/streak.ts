import type { Habito, RegistroDiario } from '../db/types'
import { toISODate, todayISO } from '../utils/date'
import { aplicaEnFecha, seCumplioEnFecha } from './dailyStatus'

function fechaAnterior(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() - 1)
  return toISODate(d)
}

function fechaSiguiente(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() + 1)
  return toISODate(d)
}

/** Lunes de la semana ISO (semana empieza el lunes) a la que pertenece la fecha dada. */
function lunesDeLaSemana(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const diaSemana = d.getDay() // 0 = domingo
  const offset = diaSemana === 0 ? 6 : diaSemana - 1
  d.setDate(d.getDate() - offset)
  return toISODate(d)
}

function semanaAnterior(lunes: string): string {
  const [year, month, day] = lunes.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() - 7)
  return toISODate(d)
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
  const registrosPorFecha = new Map(registros.map((r) => [r.fecha, r]))

  if (habito.frecuencia === 'x_veces_semana') {
    return rachaPorSemanas(habito, registros, hoy)
  }

  let racha = 0
  let cursor = hoy

  // Si hoy es aplicable pero todavía no está logrado, no cuenta como "roto": empezamos desde ayer.
  if (aplicaEnFecha(habito, cursor) && !seCumplioEnFecha(habito, registrosPorFecha.get(cursor))) {
    cursor = fechaAnterior(cursor)
  }

  while (cursor >= habito.fechaInicio) {
    if (!aplicaEnFecha(habito, cursor)) {
      cursor = fechaAnterior(cursor)
      continue
    }
    if (seCumplioEnFecha(habito, registrosPorFecha.get(cursor))) {
      racha++
      cursor = fechaAnterior(cursor)
    } else {
      break
    }
  }

  return racha
}

function rachaPorSemanas(habito: Habito, registros: RegistroDiario[], hoy: string): number {
  const meta = habito.vecesPorSemana ?? 1
  const registrosPorFecha = new Map(registros.map((r) => [r.fecha, r]))

  function cumplidosEnSemana(lunes: string): number {
    let cumplidos = 0
    let dia = lunes
    for (let i = 0; i < 7; i++) {
      if (dia >= habito.fechaInicio && dia <= hoy && seCumplioEnFecha(habito, registrosPorFecha.get(dia))) {
        cumplidos++
      }
      dia = fechaSiguiente(dia)
    }
    return cumplidos
  }

  let racha = 0
  let semana = lunesDeLaSemana(hoy)

  // La semana actual (incompleta) no rompe la racha si todavía no llegó a la meta: se ignora y se empieza desde la anterior.
  if (cumplidosEnSemana(semana) < meta) {
    semana = semanaAnterior(semana)
  }

  while (semana >= lunesDeLaSemana(habito.fechaInicio)) {
    if (cumplidosEnSemana(semana) >= meta) {
      racha++
      semana = semanaAnterior(semana)
    } else {
      break
    }
  }

  return racha
}
