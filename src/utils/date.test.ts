import { describe, expect, it } from 'vitest'
import { formatearFechaCorta } from './date'

describe('formatearFechaCorta', () => {
  it('formatea como DD/MM/YYYY (Uruguay)', () => {
    expect(formatearFechaCorta('2026-07-28', 'DD/MM/YYYY')).toBe('28/07/2026')
  })

  it('formatea como MM/DD/YYYY', () => {
    expect(formatearFechaCorta('2026-07-28', 'MM/DD/YYYY')).toBe('07/28/2026')
  })
})
