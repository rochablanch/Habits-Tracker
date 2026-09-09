import { beforeEach, describe, expect, it } from 'vitest'
import type { Habito } from '../db/types'
import {
  guardarNotificados,
  leerNotificados,
  sinNotificarTodavia,
  textoNotificacion,
} from './notifications'

function habito(cambios: Partial<Habito> = {}): Habito {
  return {
    id: 1,
    uuid: 'habito-uuid-1',
    nombre: 'Tomar agua',
    icono: 'Droplet',
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

describe('sinNotificarTodavia', () => {
  it('deja pasar los hábitos que todavía no se notificaron', () => {
    const pendientes = [habito(), habito({ id: 2, nombre: 'Leer' })]
    expect(sinNotificarTodavia(pendientes, [1]).map((h) => h.id)).toEqual([2])
  })

  it('no repite una notificación ya enviada', () => {
    expect(sinNotificarTodavia([habito()], [1])).toEqual([])
  })
})

describe('textoNotificacion', () => {
  it('usa el nombre del hábito y su hora', () => {
    expect(textoNotificacion(habito())).toEqual({
      titulo: 'Tomar agua',
      cuerpo: 'Es hora de tu hábito de las 08:00.',
    })
  })

  it('funciona aunque el hábito no tenga hora preferida', () => {
    expect(textoNotificacion(habito({ horaPreferida: undefined })).cuerpo).toBe(
      'Te quedó pendiente este hábito.',
    )
  })
})

describe('memoria de notificaciones enviadas', () => {
  beforeEach(() => localStorage.clear())

  it('recuerda lo enviado hoy', () => {
    guardarNotificados('2026-07-28', [1, 2])
    expect(leerNotificados('2026-07-28')).toEqual([1, 2])
  })

  it('al día siguiente vuelve a notificar', () => {
    guardarNotificados('2026-07-27', [1])
    expect(leerNotificados('2026-07-28')).toEqual([])
  })

  it('tolera datos corruptos en localStorage', () => {
    localStorage.setItem('habitos-tracker-recordatorios-notificados', '{roto')
    expect(leerNotificados('2026-07-28')).toEqual([])
  })
})
