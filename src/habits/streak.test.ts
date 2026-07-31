import { describe, expect, it } from 'vitest'
import type { Habito, RegistroDiario } from '../db/types'
import { calcularRachaActual, calcularRachaMaxima } from './streak'

const HOY = '2026-07-28' // martes

function habito(cambios: Partial<Habito> = {}): Habito {
  return {
    id: 1,
    uuid: 'habito-uuid-1',
    nombre: 'Hábito',
    icono: 'Sparkles',
    color: '#6366f1',
    categoriaId: null,
    fechaInicio: '2026-06-01',
    tipo: 'si_no',
    frecuencia: 'diaria',
    diasSemana: [],
    vecesPorDia: 1,
    recordatorio: false,
    prioridad: 'media',
    estado: 'activo',
    eliminado: false,
    createdAt: '',
    updatedAt: '',
    ...cambios,
  }
}

function completado(fecha: string): RegistroDiario {
  return { id: 0, uuid: `registro-${fecha}`, habitoId: 1, fecha, estado: 'completado', createdAt: '', updatedAt: '' }
}

describe('calcularRachaActual — hábitos diarios', () => {
  it('cuenta los días consecutivos logrados terminando hoy', () => {
    const h = habito()
    const registros = [completado('2026-07-26'), completado('2026-07-27'), completado(HOY)]
    expect(calcularRachaActual(h, registros, HOY)).toBe(3)
  })

  it('si hoy todavía no se marcó, no rompe la racha: cuenta desde ayer', () => {
    const h = habito()
    const registros = [completado('2026-07-26'), completado('2026-07-27')]
    expect(calcularRachaActual(h, registros, HOY)).toBe(2)
  })

  it('un día salteado sin registro corta la racha', () => {
    const h = habito()
    const registros = [completado('2026-07-20'), completado(HOY)] // falta 07-27
    expect(calcularRachaActual(h, registros, HOY)).toBe(1)
  })

  it('sin ningún registro, la racha es 0', () => {
    expect(calcularRachaActual(habito(), [], HOY)).toBe(0)
  })
})

describe('calcularRachaActual — días específicos de la semana', () => {
  it('los días no aplicables no rompen la racha', () => {
    const h = habito({ frecuencia: 'dias_semana', diasSemana: [1, 3, 5] }) // L, M, V
    const registros = [
      completado('2026-07-20'), // lunes
      completado('2026-07-22'), // miércoles
      completado('2026-07-24'), // viernes
      completado('2026-07-27'), // lunes
    ]
    // hoy (martes) no es aplicable, así que se ignora y se cuenta desde el lunes 27 hacia atrás
    expect(calcularRachaActual(h, registros, HOY)).toBe(4)
  })

  it('un día aplicable sin registro corta la racha', () => {
    const h = habito({ frecuencia: 'dias_semana', diasSemana: [1, 3, 5] })
    const registros = [completado('2026-07-24'), completado('2026-07-27')] // falta el miércoles 22
    expect(calcularRachaActual(h, registros, HOY)).toBe(2)
  })
})

describe('calcularRachaActual — x veces por semana', () => {
  it('cuenta semanas consecutivas donde se llegó a la meta semanal', () => {
    const h = habito({ frecuencia: 'x_veces_semana', vecesPorSemana: 3, fechaInicio: '2026-06-01' })
    const registros = [
      // semana del 20 al 26: 3 cumplidos (llega a la meta)
      completado('2026-07-20'),
      completado('2026-07-22'),
      completado('2026-07-24'),
      // semana actual (27 en adelante): solo 2 hasta hoy, no llega a la meta todavía
      completado('2026-07-27'),
      completado(HOY),
    ]
    // la semana actual, incompleta, no rompe la racha; la semana anterior sí llegó a la meta
    expect(calcularRachaActual(h, registros, HOY)).toBe(1)
  })

  it('una semana que no llegó a la meta corta la racha', () => {
    const h = habito({ frecuencia: 'x_veces_semana', vecesPorSemana: 3, fechaInicio: '2026-06-01' })
    const registros = [
      completado('2026-07-13'), // semana del 13: 1 solo, no llega a la meta
      completado('2026-07-20'),
      completado('2026-07-22'),
      completado('2026-07-24'), // semana del 20: 3, llega a la meta
    ]
    expect(calcularRachaActual(h, registros, HOY)).toBe(1)
  })
})

describe('calcularRachaMaxima — hábitos diarios', () => {
  it('encuentra la racha más larga del historial, aunque no sea la actual', () => {
    const h = habito({ fechaInicio: '2026-07-01' })
    const registros = [
      // racha de 4 días, ya cortada
      completado('2026-07-01'),
      completado('2026-07-02'),
      completado('2026-07-03'),
      completado('2026-07-04'),
      // racha actual: solo 1 día
      completado(HOY),
    ]
    expect(calcularRachaMaxima(h, registros, HOY)).toBe(4)
    expect(calcularRachaActual(h, registros, HOY)).toBe(1)
  })

  it('sin registros, la racha máxima es 0', () => {
    expect(calcularRachaMaxima(habito({ fechaInicio: '2026-07-01' }), [], HOY)).toBe(0)
  })

  it('respeta los días no aplicables igual que la racha actual', () => {
    const h = habito({ frecuencia: 'dias_semana', diasSemana: [1, 3, 5], fechaInicio: '2026-07-01' })
    const registros = [completado('2026-07-20'), completado('2026-07-22'), completado('2026-07-24')]
    expect(calcularRachaMaxima(h, registros)).toBe(3)
  })
})

describe('calcularRachaMaxima — x veces por semana', () => {
  it('encuentra la racha de semanas más larga del historial', () => {
    const h = habito({ frecuencia: 'x_veces_semana', vecesPorSemana: 3, fechaInicio: '2026-06-01' })
    const registros = [
      // dos semanas seguidas cumpliendo la meta (racha máxima = 2)
      completado('2026-06-01'),
      completado('2026-06-03'),
      completado('2026-06-05'),
      completado('2026-06-08'),
      completado('2026-06-10'),
      completado('2026-06-12'),
      // semana suelta que no llega a la meta
      completado('2026-06-22'),
    ]
    expect(calcularRachaMaxima(h, registros, HOY)).toBe(2)
  })

  it('no penaliza la semana actual incompleta', () => {
    const h = habito({ frecuencia: 'x_veces_semana', vecesPorSemana: 3, fechaInicio: '2026-06-01' })
    const registros = [
      completado('2026-07-20'),
      completado('2026-07-22'),
      completado('2026-07-24'), // semana del 20: cumple la meta
      completado('2026-07-27'), // semana actual: solo 1 hasta ahora
    ]
    expect(calcularRachaMaxima(h, registros, HOY)).toBe(1)
  })
})
