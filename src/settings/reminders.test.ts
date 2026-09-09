import { beforeEach, describe, expect, it } from 'vitest'
import type { Habito } from '../db/types'
import {
  guardarDescartes,
  horaActualHHMM,
  leerDescartes,
  minutosDesde,
  recordatoriosPendientes,
} from './reminders'

function habito(cambios: Partial<Habito> = {}): Habito {
  return {
    id: 1,
    uuid: 'habito-uuid-1',
    nombre: 'Tomar agua',
    icono: 'Sparkles',
    color: '#6366f1',
    categoriaId: null,
    fechaInicio: '2026-07-01',
    tipo: 'si_no',
    frecuencia: 'diaria',
    diasSemana: [],
    vecesPorDia: 1,
    recordatorio: true,
    horaPreferida: '08:00',
    prioridad: 'media',
    estado: 'activo',
    eliminado: false,
    createdAt: '',
    updatedAt: '',
    ...cambios,
  }
}

function pendientes(cambios: Partial<Parameters<typeof recordatoriosPendientes>[0]> = {}) {
  return recordatoriosPendientes({
    habitos: [habito()],
    registradosHoy: new Set<number>(),
    fecha: '2026-07-28', // martes
    horaActual: '08:00',
    descartados: [],
    ...cambios,
  })
}

describe('horaActualHHMM', () => {
  it('completa con cero a la izquierda', () => {
    expect(horaActualHHMM(new Date(2026, 6, 28, 8, 5))).toBe('08:05')
    expect(horaActualHHMM(new Date(2026, 6, 28, 21, 30))).toBe('21:30')
  })
})

describe('recordatoriosPendientes', () => {
  it('avisa cuando llega la hora preferida', () => {
    expect(pendientes()).toHaveLength(1)
  })

  it('sigue avisando aunque el minuto exacto ya haya pasado', () => {
    // El caso real que fallaba: la app estaba cerrada o en segundo plano a las 08:00.
    expect(pendientes({ horaActual: '09:47' })).toHaveLength(1)
  })

  it('no avisa antes de la hora preferida', () => {
    expect(pendientes({ horaActual: '07:59' })).toHaveLength(0)
  })

  it('no avisa si el hábito no tiene el recordatorio activado', () => {
    expect(pendientes({ habitos: [habito({ recordatorio: false })] })).toHaveLength(0)
  })

  it('no avisa si el hábito no tiene hora preferida', () => {
    expect(pendientes({ habitos: [habito({ horaPreferida: undefined })] })).toHaveLength(0)
  })

  it('no avisa si el hábito ya fue registrado hoy', () => {
    expect(pendientes({ registradosHoy: new Set([1]) })).toHaveLength(0)
  })

  it('no avisa si el aviso ya fue descartado', () => {
    expect(pendientes({ descartados: [1] })).toHaveLength(0)
  })

  it('no avisa en un día que no corresponde al hábito', () => {
    const soloLunes = habito({ frecuencia: 'dias_semana', diasSemana: [1] })
    expect(pendientes({ habitos: [soloLunes] })).toHaveLength(0) // 2026-07-28 es martes
    expect(pendientes({ habitos: [soloLunes], fecha: '2026-07-27' })).toHaveLength(1)
  })

  it('no avisa antes de la fecha de inicio del hábito', () => {
    expect(pendientes({ habitos: [habito({ fechaInicio: '2026-08-01' })] })).toHaveLength(0)
  })
})

describe('minutosDesde', () => {
  it('cuenta los minutos transcurridos desde la hora preferida', () => {
    expect(minutosDesde('08:00', '08:00')).toBe(0)
    expect(minutosDesde('08:00', '08:45')).toBe(45)
    expect(minutosDesde('08:00', '10:30')).toBe(150)
  })
})

describe('descartes guardados', () => {
  beforeEach(() => localStorage.clear())

  it('devuelve lo guardado para el mismo día', () => {
    guardarDescartes('2026-07-28', [1, 2])
    expect(leerDescartes('2026-07-28')).toEqual([1, 2])
  })

  it('ignora los descartes de otro día', () => {
    guardarDescartes('2026-07-27', [1])
    expect(leerDescartes('2026-07-28')).toEqual([])
  })

  it('tolera datos corruptos en localStorage', () => {
    localStorage.setItem('habitos-tracker-recordatorios-descartados', 'no es json')
    expect(leerDescartes('2026-07-28')).toEqual([])
  })
})
