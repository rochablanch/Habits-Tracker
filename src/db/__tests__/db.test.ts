import { describe, expect, it } from 'vitest'
import { HabitosDB } from '../db'

describe('HabitosDB', () => {
  it('siembra categorías predefinidas y configuración por defecto al crearse por primera vez', async () => {
    const testDb = new HabitosDB(`test-populate-${Date.now()}`)
    await testDb.open()

    const categorias = await testDb.categorias.toArray()
    const configuracion = await testDb.configuracion.get(1)

    expect(categorias.length).toBe(11)
    expect(categorias.map((c) => c.nombre)).toContain('Salud')
    expect(configuracion).toMatchObject({ primerDiaSemana: 1, animaciones: true })

    await testDb.delete()
  })
})
