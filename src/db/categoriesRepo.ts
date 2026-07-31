import { db } from './db'
import type { Categoria } from './types'

export async function listarCategorias(): Promise<Categoria[]> {
  return db.categorias.orderBy('nombre').toArray()
}

export async function crearCategoria(datos: Omit<Categoria, 'id' | 'uuid' | 'predefinida'>): Promise<number> {
  return db.categorias.add({ ...datos, uuid: crypto.randomUUID(), predefinida: false })
}

export async function actualizarCategoria(
  id: number,
  cambios: Partial<Omit<Categoria, 'id' | 'uuid' | 'predefinida'>>,
): Promise<void> {
  await db.categorias.update(id, cambios)
}

/** Elimina una categoría. Los hábitos que la usaban quedan sin categoría (no se borran). */
export async function eliminarCategoria(id: number): Promise<void> {
  await db.transaction('rw', db.categorias, db.habitos, async () => {
    await db.habitos.where('categoriaId').equals(id).modify({ categoriaId: null })
    await db.categorias.delete(id)
  })
}
