import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  archivarHabito,
  crearHabito,
  duplicarHabito,
  eliminarHabito,
  listarHabitos,
  obtenerHabito,
  pausarHabito,
  reactivarHabito,
  type NuevoHabito,
} from '../habitsRepo'
import { obtenerRegistro, registrarCumplimiento } from '../logsRepo'

afterEach(async () => {
  await Promise.all([db.habitos.clear(), db.registros.clear(), db.eliminaciones.clear()])
})

function habitoDeEjemplo(datos: Partial<NuevoHabito> = {}): NuevoHabito {
  return {
    nombre: 'Meditar',
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
    ...datos,
  }
}

describe('habitsRepo', () => {
  it('crea un hábito con fechas de auditoría y lo puede obtener', async () => {
    const id = await crearHabito(habitoDeEjemplo())
    const habito = await obtenerHabito(id)

    expect(habito?.nombre).toBe('Meditar')
    expect(habito?.eliminado).toBe(false)
    expect(habito?.createdAt).toBeTruthy()
  })

  it('listarHabitos excluye eliminados por defecto y respeta filtro de estado', async () => {
    await crearHabito(habitoDeEjemplo({ nombre: 'Activo', estado: 'activo' }))
    const idPausado = await crearHabito(habitoDeEjemplo({ nombre: 'Pausado', estado: 'activo' }))
    await pausarHabito(idPausado)

    const activos = await listarHabitos({ estado: 'activo' })
    const pausados = await listarHabitos({ estado: 'pausado' })

    expect(activos.map((h) => h.nombre)).toEqual(['Activo'])
    expect(pausados.map((h) => h.nombre)).toEqual(['Pausado'])
  })

  it('archivar y reactivar cambian el estado de forma reversible', async () => {
    const id = await crearHabito(habitoDeEjemplo())
    await archivarHabito(id)
    expect((await obtenerHabito(id))?.estado).toBe('archivado')

    await reactivarHabito(id)
    expect((await obtenerHabito(id))?.estado).toBe('activo')
  })

  it('duplicar crea una copia independiente sin arrastrar los registros', async () => {
    const id = await crearHabito(habitoDeEjemplo())
    await registrarCumplimiento(id, '2026-07-28', { estado: 'completado' })

    const copiaId = await duplicarHabito(id)
    const copia = await obtenerHabito(copiaId)

    expect(copia?.nombre).toBe('Meditar (copia)')
    expect(copiaId).not.toBe(id)
    expect((await db.registros.where('habitoId').equals(copiaId).count())).toBe(0)
  })

  it('eliminar (borrado suave) oculta el hábito pero conserva su historial', async () => {
    const id = await crearHabito(habitoDeEjemplo())
    await registrarCumplimiento(id, '2026-07-28', { estado: 'completado' })

    await eliminarHabito(id)

    expect(await listarHabitos()).toHaveLength(0)
    expect((await obtenerHabito(id))?.eliminado).toBe(true)
    expect(await db.registros.where('habitoId').equals(id).count()).toBe(1)
  })

  it('eliminar con borrarHistorial=true borra también los registros, de forma permanente', async () => {
    const id = await crearHabito(habitoDeEjemplo())
    await registrarCumplimiento(id, '2026-07-28', { estado: 'completado' })

    await eliminarHabito(id, { borrarHistorial: true })

    expect(await obtenerHabito(id)).toBeUndefined()
    expect(await db.registros.where('habitoId').equals(id).count()).toBe(0)
  })

  it('eliminar con borrarHistorial=true deja constancia (para sincronizar) del hábito y sus registros borrados', async () => {
    const habito = await obtenerHabito(await crearHabito(habitoDeEjemplo()))
    const idHabito = habito!.id
    await registrarCumplimiento(idHabito, '2026-07-28', { estado: 'completado' })
    const registro = await obtenerRegistro(idHabito, '2026-07-28')

    await eliminarHabito(idHabito, { borrarHistorial: true })

    const eliminaciones = await db.eliminaciones.toArray()
    expect(eliminaciones.map((e) => e.uuid)).toEqual(expect.arrayContaining([habito!.uuid, registro!.uuid]))
    expect(eliminaciones.find((e) => e.uuid === habito!.uuid)?.tabla).toBe('habitos')
    expect(eliminaciones.find((e) => e.uuid === registro!.uuid)?.tabla).toBe('registros')
  })

  it('eliminar (borrado suave) no deja constancia para sincronizar: la fila local sigue existiendo', async () => {
    const id = await crearHabito(habitoDeEjemplo())
    await eliminarHabito(id)
    expect(await db.eliminaciones.count()).toBe(0)
  })
})
