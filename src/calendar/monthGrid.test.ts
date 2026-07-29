import { describe, expect, it } from 'vitest'
import { anioMesDeFecha, diasDelMesVisible, sumarMeses } from './monthGrid'

describe('sumarMeses', () => {
  it('suma meses dentro del mismo año', () => {
    expect(sumarMeses('2026-07', 1)).toBe('2026-08')
  })

  it('resta meses cruzando el fin de año', () => {
    expect(sumarMeses('2026-01', -1)).toBe('2025-12')
  })

  it('suma meses cruzando el fin de año', () => {
    expect(sumarMeses('2026-12', 1)).toBe('2027-01')
  })
})

describe('anioMesDeFecha', () => {
  it('extrae "YYYY-MM" de una fecha completa', () => {
    expect(anioMesDeFecha('2026-07-28')).toBe('2026-07')
  })
})

describe('diasDelMesVisible', () => {
  it('julio 2026 (empieza miércoles, termina viernes), semana desde el lunes', () => {
    const dias = diasDelMesVisible('2026-07', 1)
    expect(dias[0]).toBe('2026-06-29') // lunes antes del 1 de julio
    expect(dias[dias.length - 1]).toBe('2026-08-02') // domingo después del 31 de julio
    expect(dias.length % 7).toBe(0)
    expect(dias).toContain('2026-07-01')
    expect(dias).toContain('2026-07-31')
  })

  it('semana desde el domingo da un resultado distinto', () => {
    const dias = diasDelMesVisible('2026-07', 0)
    expect(dias[0]).toBe('2026-06-28') // domingo antes del 1 de julio
    expect(dias[dias.length - 1]).toBe('2026-08-01') // sábado después del 31 de julio
  })

  it('todas las fechas son consecutivas y sin duplicados', () => {
    const dias = diasDelMesVisible('2026-02', 1)
    const unicos = new Set(dias)
    expect(unicos.size).toBe(dias.length)
  })
})
