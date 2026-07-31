import { describe, expect, it } from 'vitest'
import type { Habito, RegistroDiario } from '../db/types'
import { aplicaEnFecha, estadoVisualDia, metaDelDia, seCumplioEnFecha, unidadDia, usaContador } from './dailyStatus'

function habito(cambios: Partial<Habito> = {}): Habito {
  return {
    id: 1,
    uuid: 'habito-uuid-1',
    nombre: 'Hábito',
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

function registro(cambios: Partial<RegistroDiario> = {}): RegistroDiario {
  return {
    id: 1,
    uuid: 'registro-uuid-1',
    habitoId: 1,
    fecha: '2026-07-28',
    estado: 'completado',
    createdAt: '',
    updatedAt: '',
    ...cambios,
  }
}

describe('aplicaEnFecha', () => {
  it('un hábito diario aplica todos los días desde su inicio', () => {
    const h = habito({ frecuencia: 'diaria', fechaInicio: '2026-07-01' })
    expect(aplicaEnFecha(h, '2026-07-28')).toBe(true)
    expect(aplicaEnFecha(h, '2026-06-30')).toBe(false)
  })

  it('un hábito de días específicos solo aplica esos días de la semana', () => {
    // 2026-07-28 es martes (isoWeekday = 2)
    const h = habito({ frecuencia: 'dias_semana', diasSemana: [1, 3, 5] })
    expect(aplicaEnFecha(h, '2026-07-28')).toBe(false)
    expect(aplicaEnFecha(h, '2026-07-27')).toBe(true) // lunes
  })

  it('un hábito de "x veces por semana" aplica cualquier día', () => {
    const h = habito({ frecuencia: 'x_veces_semana', vecesPorSemana: 3 })
    expect(aplicaEnFecha(h, '2026-07-28')).toBe(true)
  })
})

describe('usaContador / metaDelDia / unidadDia', () => {
  it('un sí/no simple (1 vez por día) no usa contador', () => {
    const h = habito({ tipo: 'si_no', vecesPorDia: 1 })
    expect(usaContador(h)).toBe(false)
    expect(metaDelDia(h)).toBeUndefined()
  })

  it('un sí/no con varias veces por día sí usa contador, con meta = vecesPorDia', () => {
    const h = habito({ tipo: 'si_no', vecesPorDia: 3 })
    expect(usaContador(h)).toBe(true)
    expect(metaDelDia(h)).toBe(3)
    expect(unidadDia(h)).toBe('veces')
  })

  it('cantidad/tiempo/límite siempre usan contador, con meta = metaCantidad', () => {
    const h = habito({ tipo: 'cantidad', metaCantidad: 8, unidadMedida: 'vasos' })
    expect(usaContador(h)).toBe(true)
    expect(metaDelDia(h)).toBe(8)
    expect(unidadDia(h)).toBe('vasos')
  })
})

describe('estadoVisualDia / seCumplioEnFecha', () => {
  it('sin registro es pendiente', () => {
    expect(estadoVisualDia(habito(), undefined)).toBe('pendiente')
  })

  it('omitido se respeta sin importar el tipo', () => {
    const h = habito({ tipo: 'cantidad', metaCantidad: 8 })
    expect(estadoVisualDia(h, registro({ estado: 'omitido' }))).toBe('omitido')
  })

  it('sí/no simple completado es logrado', () => {
    const h = habito({ tipo: 'si_no', vecesPorDia: 1 })
    expect(estadoVisualDia(h, registro())).toBe('logrado')
    expect(seCumplioEnFecha(h, registro())).toBe(true)
  })

  it('cantidad por debajo de la meta es parcial, en o por encima es logrado', () => {
    const h = habito({ tipo: 'cantidad', metaCantidad: 8 })
    expect(estadoVisualDia(h, registro({ valor: 5 }))).toBe('parcial')
    expect(estadoVisualDia(h, registro({ valor: 8 }))).toBe('logrado')
    expect(estadoVisualDia(h, registro({ valor: 10 }))).toBe('logrado')
  })

  it('límite máximo dentro del límite es logrado, por encima es excedido', () => {
    const h = habito({ tipo: 'limite_maximo', metaCantidad: 3 })
    expect(estadoVisualDia(h, registro({ valor: 2 }))).toBe('logrado')
    expect(estadoVisualDia(h, registro({ valor: 3 }))).toBe('logrado')
    expect(estadoVisualDia(h, registro({ valor: 4 }))).toBe('excedido')
    expect(seCumplioEnFecha(h, registro({ valor: 4 }))).toBe(false)
  })
})
