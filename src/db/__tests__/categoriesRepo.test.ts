import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { actualizarCategoria, crearCategoria, eliminarCategoria, listarCategorias } from '../categoriesRepo'
import { crearHabito, obtenerHabito, type NuevoHabito } from '../habitsRepo'

afterEach(async () => {
  await Promise.all([db.categorias.clear(), db.habitos.clear(), db.eliminaciones.clear()])
})

function habitoDeEjemplo(categoriaId: number | null): NuevoHabito {
  return {
    nombre: 'Leer',
    icono: 'BookOpen',
    color: '#8b5cf6',
    categoriaId,
    fechaInicio: '2026-07-01',
    tipo: 'tiempo',
    frecuencia: 'diaria',
    diasSemana: [],
    vecesPorDia: 1,
    recordatorio: false,
    prioridad: 'media',
    estado: 'activo',
  }
}

describe('categoriesRepo', () => {
  it('crea categorías personalizadas marcadas como no predefinidas', async () => {
    const id = await crearCategoria({ nombre: 'Mascotas', color: '#f59e0b', icono: 'Dog' })
    const categorias = await listarCategorias()
    expect(categorias.find((c) => c.id === id)).toMatchObject({ nombre: 'Mascotas', predefinida: false })
  })

  it('actualiza una categoría existente', async () => {
    const id = await crearCategoria({ nombre: 'Mascotas', color: '#f59e0b', icono: 'Dog' })
    await actualizarCategoria(id, { nombre: 'Mascota' })
    const categorias = await listarCategorias()
    expect(categorias.find((c) => c.id === id)?.nombre).toBe('Mascota')
  })

  it('al eliminar una categoría, los hábitos que la usaban quedan sin categoría en vez de romperse', async () => {
    const categoriaId = await crearCategoria({ nombre: 'Mascotas', color: '#f59e0b', icono: 'Dog' })
    const habitoId = await crearHabito(habitoDeEjemplo(categoriaId))

    await eliminarCategoria(categoriaId)

    expect((await obtenerHabito(habitoId))?.categoriaId).toBeNull()
    expect((await listarCategorias()).find((c) => c.id === categoriaId)).toBeUndefined()
  })

  it('al eliminar una categoría deja constancia (para sincronizar) de la categoría borrada', async () => {
    const categoriaId = await crearCategoria({ nombre: 'Mascotas', color: '#f59e0b', icono: 'Dog' })
    const categoria = (await listarCategorias()).find((c) => c.id === categoriaId)!

    await eliminarCategoria(categoriaId)

    const eliminaciones = await db.eliminaciones.toArray()
    expect(eliminaciones).toHaveLength(1)
    expect(eliminaciones[0]).toMatchObject({ uuid: categoria.uuid, tabla: 'categorias' })
  })
})
