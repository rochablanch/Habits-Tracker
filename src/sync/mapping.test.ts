import { describe, expect, it } from 'vitest'
import type { Categoria, Habito, RegistroDiario } from '../db/types'
import {
  categoriaARemoto,
  habitoARemoto,
  registroARemoto,
  remotoACategoria,
  remotoAHabito,
  remotoARegistro,
  remotoEsMasNuevo,
} from './mapping'

const USER_ID = 'usuario-1'

function habitoDeEjemplo(cambios: Partial<Habito> = {}): Habito {
  return {
    id: 1,
    uuid: 'habito-uuid-1',
    nombre: 'Meditar',
    descripcion: 'Todas las mañanas',
    icono: 'Sparkles',
    color: '#6366f1',
    categoriaId: 5,
    fechaInicio: '2026-07-01',
    tipo: 'tiempo',
    frecuencia: 'diaria',
    diasSemana: [],
    vecesPorSemana: undefined,
    vecesPorDia: 1,
    unidadMedida: 'minutos',
    metaCantidad: 20,
    horaPreferida: '08:00',
    recordatorio: true,
    prioridad: 'alta',
    notas: 'Con la app Calm',
    estado: 'activo',
    eliminado: false,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
    ...cambios,
  }
}

function registroDeEjemplo(cambios: Partial<RegistroDiario> = {}): RegistroDiario {
  return {
    id: 1,
    uuid: 'registro-uuid-1',
    habitoId: 1,
    fecha: '2026-07-28',
    estado: 'completado',
    valor: 20,
    motivoOmision: undefined,
    nota: 'Buena sesión',
    createdAt: '2026-07-28T08:00:00.000Z',
    updatedAt: '2026-07-28T08:00:00.000Z',
    ...cambios,
  }
}

function categoriaDeEjemplo(cambios: Partial<Categoria> = {}): Categoria {
  return {
    id: 5,
    uuid: 'categoria-uuid-5',
    nombre: 'Bienestar',
    color: '#8b5cf6',
    icono: 'HeartPulse',
    predefinida: false,
    ...cambios,
  }
}

describe('mapeo hábito ↔ remoto', () => {
  it('conserva todos los campos en el viaje de ida y vuelta', () => {
    const habito = habitoDeEjemplo()
    const remoto = habitoARemoto(habito, USER_ID, 'categoria-uuid-5')
    const { id: _id, categoriaId, ...resto } = habito
    const vueltaALocal = remotoAHabito(remoto, categoriaId)

    expect(vueltaALocal).toMatchObject(resto)
    expect(remoto.user_id).toBe(USER_ID)
    expect(remoto.categoria_uuid).toBe('categoria-uuid-5')
  })

  it('campos opcionales ausentes se guardan como null (no undefined) para Postgres', () => {
    const habito = habitoDeEjemplo({ descripcion: undefined, notas: undefined, horaPreferida: undefined })
    const remoto = habitoARemoto(habito, USER_ID, null)
    expect(remoto.descripcion).toBeNull()
    expect(remoto.notas).toBeNull()
    expect(remoto.hora_preferida).toBeNull()
    expect(remoto.categoria_uuid).toBeNull()
  })

  it('un hábito sin categoría no manda categoria_uuid, y vuelve con categoriaId null', () => {
    const remoto = habitoARemoto(habitoDeEjemplo({ categoriaId: null }), USER_ID, null)
    const local = remotoAHabito(remoto, null)
    expect(local.categoriaId).toBeNull()
  })
})

describe('mapeo registro ↔ remoto', () => {
  it('conserva todos los campos en el viaje de ida y vuelta', () => {
    const registro = registroDeEjemplo()
    const remoto = registroARemoto(registro, USER_ID, 'habito-uuid-1')
    const { id: _id, habitoId, ...resto } = registro
    const vueltaALocal = remotoARegistro(remoto, habitoId)

    expect(vueltaALocal).toMatchObject(resto)
    expect(remoto.habito_uuid).toBe('habito-uuid-1')
  })
})

describe('mapeo categoría ↔ remoto', () => {
  it('conserva todos los campos en el viaje de ida y vuelta', () => {
    const categoria = categoriaDeEjemplo()
    const remoto = categoriaARemoto(categoria, USER_ID)
    const { id: _id, ...resto } = categoria
    const vueltaALocal = remotoACategoria({ ...remoto, updated_at: '2026-07-28T00:00:00.000Z' })

    expect(vueltaALocal).toEqual(resto)
  })
})

describe('remotoEsMasNuevo (última escritura gana)', () => {
  it('el remoto gana si su fecha de edición es posterior', () => {
    expect(remotoEsMasNuevo('2026-07-28T10:00:00.000Z', '2026-07-28T10:00:01.000Z')).toBe(true)
  })

  it('el local gana si su fecha de edición es posterior', () => {
    expect(remotoEsMasNuevo('2026-07-28T10:00:01.000Z', '2026-07-28T10:00:00.000Z')).toBe(false)
  })

  it('compara el instante real, no el formato del texto (offset +00:00 vs. Z)', () => {
    // Postgres puede devolver "+00:00" en vez de "Z"; representan el mismo instante.
    expect(remotoEsMasNuevo('2026-07-28T10:00:00.000Z', '2026-07-28T10:00:00.000+00:00')).toBe(false)
  })
})
