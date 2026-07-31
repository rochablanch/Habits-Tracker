import { describe, expect, it } from 'vitest'
import type { Habito, RegistroDiario } from '../db/types'
import { resumenUltimosDias } from './summary'

function habito(id: number, cambios: Partial<Habito> = {}): Habito {
  return {
    id,
    uuid: `habito-uuid-${id}`,
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
  return { id: 0, uuid: `registro-${habitoId}-${fecha}`, habitoId, fecha, estado: 'completado', createdAt: '', updatedAt: '' }
}

describe('resumenUltimosDias', () => {
  it('calcula el porcentaje diario de cumplimiento sobre los hábitos aplicables', () => {
    const habitos = [habito(1), habito(2)]
    const registros = [completado(1, '2026-07-28'), completado(2, '2026-07-28')]

    const resumen = resumenUltimosDias(habitos, registros, '2026-07-28', 1)

    expect(resumen).toEqual([{ fecha: '2026-07-28', aplicables: 2, logrados: 2, porcentaje: 100 }])
  })

  it('devuelve porcentaje null (no 0%) si ningún hábito aplicaba ese día', () => {
    const h = habito(1, { fechaInicio: '2026-07-27' })
    const resumen = resumenUltimosDias([h], [], '2026-07-28', 3)
    // día 2026-07-26: antes de la fecha de inicio, no aplica todavía
    expect(resumen[0]).toMatchObject({ fecha: '2026-07-26', aplicables: 0, porcentaje: null })
  })

  it('devuelve un día por cada uno de los últimos `dias`, en orden cronológico', () => {
    const resumen = resumenUltimosDias([habito(1)], [], '2026-07-28', 3)
    expect(resumen.map((r) => r.fecha)).toEqual(['2026-07-26', '2026-07-27', '2026-07-28'])
  })
})
