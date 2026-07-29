import { describe, expect, it } from 'vitest'
import { estadoCeldaDia } from './dayCellStatus'
import type { ResumenDia } from '../habits/summary'

const HOY = '2026-07-28'

function resumen(cambios: Partial<ResumenDia>): ResumenDia {
  return { fecha: HOY, aplicables: 1, logrados: 0, porcentaje: 0, ...cambios }
}

describe('estadoCeldaDia', () => {
  it('un día futuro es "futuro", sin importar el resto de los datos', () => {
    expect(estadoCeldaDia(resumen({ fecha: '2026-07-29', porcentaje: 100 }), HOY)).toBe('futuro')
  })

  it('un día sin hábitos aplicables es "sin_habitos"', () => {
    expect(estadoCeldaDia(resumen({ aplicables: 0, porcentaje: null }), HOY)).toBe('sin_habitos')
  })

  it('100% es "completo"', () => {
    expect(estadoCeldaDia(resumen({ porcentaje: 100 }), HOY)).toBe('completo')
  })

  it('entre 0 y 100% es "parcial"', () => {
    expect(estadoCeldaDia(resumen({ porcentaje: 40 }), HOY)).toBe('parcial')
  })

  it('0% con hábitos aplicables es "sin_registros"', () => {
    expect(estadoCeldaDia(resumen({ porcentaje: 0 }), HOY)).toBe('sin_registros')
  })

  it('hoy mismo (no futuro) se evalúa normalmente', () => {
    expect(estadoCeldaDia(resumen({ fecha: HOY, porcentaje: 100 }), HOY)).toBe('completo')
  })
})
