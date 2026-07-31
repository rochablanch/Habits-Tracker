import { db } from './db'
import type { Habito } from './types'

export type NuevoHabito = Omit<Habito, 'id' | 'uuid' | 'createdAt' | 'updatedAt' | 'eliminado'>

export async function crearHabito(datos: NuevoHabito): Promise<number> {
  const ahora = new Date().toISOString()
  return db.habitos.add({
    ...datos,
    uuid: crypto.randomUUID(),
    eliminado: false,
    createdAt: ahora,
    updatedAt: ahora,
  })
}

type CambiosHabito = Partial<Omit<Habito, 'id' | 'createdAt' | 'updatedAt'>>

export async function actualizarHabito(id: number, cambios: CambiosHabito): Promise<void> {
  await db.habitos.update(id, { ...cambios, updatedAt: new Date().toISOString() })
}

export async function obtenerHabito(id: number): Promise<Habito | undefined> {
  return db.habitos.get(id)
}

export interface FiltroHabitos {
  estado?: Habito['estado']
  categoriaId?: number | null
  incluirEliminados?: boolean
}

export async function listarHabitos(filtro: FiltroHabitos = {}): Promise<Habito[]> {
  let coleccion = db.habitos.toCollection()
  if (!filtro.incluirEliminados) {
    coleccion = coleccion.filter((h) => !h.eliminado)
  }
  if (filtro.estado) {
    coleccion = coleccion.filter((h) => h.estado === filtro.estado)
  }
  if (filtro.categoriaId !== undefined) {
    coleccion = coleccion.filter((h) => h.categoriaId === filtro.categoriaId)
  }
  return coleccion.toArray()
}

export async function pausarHabito(id: number): Promise<void> {
  await actualizarHabito(id, { estado: 'pausado' })
}

export async function archivarHabito(id: number): Promise<void> {
  await actualizarHabito(id, { estado: 'archivado' })
}

export async function reactivarHabito(id: number): Promise<void> {
  await actualizarHabito(id, { estado: 'activo' })
}

export async function duplicarHabito(id: number): Promise<number> {
  const original = await db.habitos.get(id)
  if (!original) throw new Error('Hábito no encontrado')
  const { id: _sinId, createdAt: _sinCreatedAt, updatedAt: _sinUpdatedAt, ...resto } = original
  return crearHabito({ ...resto, nombre: `${original.nombre} (copia)`, estado: 'activo' })
}

/**
 * Elimina un hábito. Por defecto es un borrado suave (queda oculto de toda
 * la app pero su historial se conserva para las estadísticas). Con
 * `borrarHistorial: true` el borrado es permanente e irreversible: se
 * eliminan también todos sus registros diarios.
 */
export async function eliminarHabito(id: number, opciones: { borrarHistorial?: boolean } = {}): Promise<void> {
  if (opciones.borrarHistorial) {
    await db.transaction('rw', db.habitos, db.registros, async () => {
      await db.registros.where('habitoId').equals(id).delete()
      await db.habitos.delete(id)
    })
  } else {
    await actualizarHabito(id, { eliminado: true })
  }
}
