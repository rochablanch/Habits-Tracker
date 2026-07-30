import { describe, expect, it } from 'vitest'
import type { Categoria } from '../db/types'
import { HABITOS_SUGERIDOS, resolverHabitoSugerido } from './suggestedHabits'

const CATEGORIAS: Categoria[] = [
  { id: 1, nombre: 'Salud', color: '#ef4444', icono: 'HeartPulse', predefinida: true },
  { id: 8, nombre: 'Estudio', color: '#8b5cf6', icono: 'BookOpen', predefinida: true },
]

describe('resolverHabitoSugerido', () => {
  it('resuelve la categoría por nombre a su id real', () => {
    const sugerido = HABITOS_SUGERIDOS.find((h) => h.nombre === 'Beber agua')!
    const habito = resolverHabitoSugerido(sugerido, CATEGORIAS, '2026-07-28')
    expect(habito.categoriaId).toBe(1)
    expect(habito.fechaInicio).toBe('2026-07-28')
    expect(habito.estado).toBe('activo')
  })

  it('si la categoría no existe (todavía) en la base, queda sin categoría en vez de romper', () => {
    const sugerido = HABITOS_SUGERIDOS.find((h) => h.nombre === 'Entrenar')! // categoría "Ejercicio", no está en CATEGORIAS
    const habito = resolverHabitoSugerido(sugerido, CATEGORIAS, '2026-07-28')
    expect(habito.categoriaId).toBeNull()
  })

  it('cada hábito sugerido usa un ícono y una categoría existentes en el catálogo real', async () => {
    const { ICONOS_HABITO } = await import('../habits/icons')
    const { CATEGORIAS_PREDEFINIDAS } = await import('../db/defaultCategories')
    const nombresIconos = new Set(ICONOS_HABITO.map((i) => i.nombre))
    const nombresCategorias = new Set(CATEGORIAS_PREDEFINIDAS.map((c) => c.nombre))

    for (const sugerido of HABITOS_SUGERIDOS) {
      expect(nombresIconos.has(sugerido.icono), `ícono "${sugerido.icono}" de "${sugerido.nombre}"`).toBe(true)
      expect(nombresCategorias.has(sugerido.categoriaNombre), `categoría de "${sugerido.nombre}"`).toBe(true)
    }
  })
})
