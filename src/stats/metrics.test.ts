import { describe, expect, it } from 'vitest'
import type { Categoria, Habito, RegistroDiario } from '../db/types'
import {
  cumplimientoEnRango,
  cumplimientoPorCategoria,
  cumplimientoPorDiaSemana,
  cumplimientoPorHabito,
  diasPerfectos,
  evolucionMensual,
  evolucionSemanal,
  hayDatosSuficientes,
} from './metrics'
import type { RangoFechas } from './period'

function habito(id: number, cambios: Partial<Habito> = {}): Habito {
  return {
    id,
    nombre: `Hábito ${id}`,
    icono: 'Sparkles',
    color: '#6366f1',
    categoriaId: null,
    fechaInicio: '2026-07-01',
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

function completado(habitoId: number, fecha: string): RegistroDiario {
  return { id: 0, habitoId, fecha, estado: 'completado', createdAt: '', updatedAt: '' }
}

const RANGO: RangoFechas = { desde: '2026-07-01', hasta: '2026-07-10' } // 10 días

describe('cumplimientoPorHabito / cumplimientoEnRango', () => {
  it('calcula aplicables, logrados y porcentaje de cada hábito', () => {
    const habitos = [habito(1)]
    const registros = [completado(1, '2026-07-01'), completado(1, '2026-07-02')]

    const [resultado] = cumplimientoPorHabito(habitos, registros, RANGO)
    expect(resultado).toMatchObject({ aplicables: 10, logrados: 2, porcentaje: 20 })
  })

  it('el total suma todos los hábitos del rango', () => {
    const habitos = [habito(1), habito(2)]
    const registros = [completado(1, '2026-07-01'), completado(2, '2026-07-01'), completado(2, '2026-07-02')]

    expect(cumplimientoEnRango(habitos, registros, RANGO)).toMatchObject({
      aplicables: 20,
      logrados: 3,
      porcentaje: 15,
    })
  })

  it('porcentaje es null (no 0%) si no había hábitos aplicables', () => {
    const habitos = [habito(1, { fechaInicio: '2030-01-01' })]
    expect(cumplimientoEnRango(habitos, [], RANGO)).toEqual({ aplicables: 0, logrados: 0, porcentaje: null })
  })
})

describe('cumplimientoPorCategoria', () => {
  const salud: Categoria = { id: 1, nombre: 'Salud', color: '#ef4444', icono: 'HeartPulse', predefinida: true }
  const estudio: Categoria = { id: 2, nombre: 'Estudio', color: '#8b5cf6', icono: 'BookOpen', predefinida: true }

  it('agrupa el cumplimiento por categoría y ordena de mayor a menor', () => {
    const habitos = [habito(1, { categoriaId: 1 }), habito(2, { categoriaId: 2 })]
    const registros = [
      ...Array.from({ length: 10 }, (_, i) => completado(1, `2026-07-${String(i + 1).padStart(2, '0')}`)), // 100%
      completado(2, '2026-07-01'), // 10%
    ]

    const resultado = cumplimientoPorCategoria(habitos, [salud, estudio], registros, RANGO)

    expect(resultado[0]).toMatchObject({ categoria: salud, porcentaje: 100 })
    expect(resultado[1]).toMatchObject({ categoria: estudio, porcentaje: 10 })
  })

  it('agrupa hábitos sin categoría bajo categoria: null', () => {
    const habitos = [habito(1, { categoriaId: null })]
    const resultado = cumplimientoPorCategoria(habitos, [], [completado(1, '2026-07-01')], RANGO)
    expect(resultado[0].categoria).toBeNull()
  })
})

describe('evolucionSemanal y evolucionMensual', () => {
  it('agrupa el cumplimiento por semana (identificada por el lunes)', () => {
    // 2026-07-01 es miércoles; esa semana empieza el lunes 2026-06-29
    const habitos = [habito(1, { fechaInicio: '2026-06-29' })]
    const rango: RangoFechas = { desde: '2026-06-29', hasta: '2026-07-05' } // exactamente una semana
    const registros = [completado(1, '2026-06-29'), completado(1, '2026-06-30')]

    const resultado = evolucionSemanal(habitos, registros, rango)

    expect(resultado).toHaveLength(1)
    expect(resultado[0]).toMatchObject({ clave: '2026-06-29', aplicables: 7, logrados: 2 })
  })

  it('agrupa el cumplimiento por mes', () => {
    const habitos = [habito(1, { fechaInicio: '2026-06-01' })]
    const rango: RangoFechas = { desde: '2026-06-25', hasta: '2026-07-05' }
    const registros = [completado(1, '2026-06-30'), completado(1, '2026-07-01')]

    const resultado = evolucionMensual(habitos, registros, rango)

    expect(resultado.map((r) => r.clave)).toEqual(['2026-06', '2026-07'])
    expect(resultado[0].logrados).toBe(1)
    expect(resultado[1].logrados).toBe(1)
  })
})

describe('cumplimientoPorDiaSemana', () => {
  it('identifica el día de la semana con mejor cumplimiento', () => {
    // en RANGO (1 al 10 de julio de 2026), los lunes son 06-07-2026? calculamos con datos controlados:
    // usamos un solo hábito diario y marcamos completados solo los miércoles
    const habitos = [habito(1)]
    // 2026-07-01 es miércoles, 2026-07-08 también
    const registros = [completado(1, '2026-07-01'), completado(1, '2026-07-08')]

    const resultado = cumplimientoPorDiaSemana(habitos, registros, RANGO)
    const miercoles = resultado.find((r) => r.diaSemana === 3)!

    expect(miercoles.logrados).toBe(2)
    expect(miercoles.porcentaje).toBe(100)
  })
})

describe('diasPerfectos', () => {
  it('cuenta los días donde se cumplieron todos los hábitos aplicables', () => {
    const habitos = [habito(1), habito(2)]
    const registros = [
      completado(1, '2026-07-01'),
      completado(2, '2026-07-01'), // día perfecto
      completado(1, '2026-07-02'), // falta habito 2: no perfecto
    ]

    expect(diasPerfectos(habitos, registros, RANGO)).toBe(1)
  })
})

describe('hayDatosSuficientes', () => {
  it('exige al menos 7 días aplicables', () => {
    expect(hayDatosSuficientes(6)).toBe(false)
    expect(hayDatosSuficientes(7)).toBe(true)
  })
})
