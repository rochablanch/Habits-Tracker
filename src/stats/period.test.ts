import { describe, expect, it } from 'vitest'
import { calcularRango, rangoAnterior } from './period'

const HOY = '2026-07-28'

describe('calcularRango', () => {
  it('últimos 7 días incluye hoy y los 6 anteriores', () => {
    expect(calcularRango('7d', HOY)).toEqual({ desde: '2026-07-22', hasta: HOY })
  })

  it('últimos 30 días', () => {
    expect(calcularRango('30d', HOY)).toEqual({ desde: '2026-06-29', hasta: HOY })
  })

  it('últimos 90 días', () => {
    expect(calcularRango('90d', HOY)).toEqual({ desde: '2026-04-30', hasta: HOY })
  })

  it('este año va del 1 de enero a hoy', () => {
    expect(calcularRango('anio', HOY)).toEqual({ desde: '2026-01-01', hasta: HOY })
  })

  it('personalizado usa el rango dado, o hoy-hoy si no se especifica', () => {
    expect(calcularRango('personalizado', HOY, { desde: '2026-01-01', hasta: '2026-03-31' })).toEqual({
      desde: '2026-01-01',
      hasta: '2026-03-31',
    })
    expect(calcularRango('personalizado', HOY)).toEqual({ desde: HOY, hasta: HOY })
  })
})

describe('rangoAnterior', () => {
  it('devuelve el período inmediatamente anterior, de igual duración', () => {
    const actual = calcularRango('7d', HOY) // 22 al 28 (7 días)
    expect(rangoAnterior(actual)).toEqual({ desde: '2026-07-15', hasta: '2026-07-21' })
  })

  it('funciona con rangos de un solo día', () => {
    expect(rangoAnterior({ desde: HOY, hasta: HOY })).toEqual({ desde: '2026-07-27', hasta: '2026-07-27' })
  })
})
