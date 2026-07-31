import Dexie from 'dexie'
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

  it('a una base de datos que ya existía antes de "uuid" (v1) se le asigna uno a cada fila al migrar a v2', async () => {
    const nombre = `test-migracion-${Date.now()}`

    // Simula un dispositivo con datos guardados antes de que existiera el campo "uuid".
    const dbVieja = new Dexie(nombre)
    dbVieja.version(1).stores({
      habitos: '++id, categoriaId, estado, eliminado',
      registros: '++id, habitoId, fecha, &[habitoId+fecha]',
      categorias: '++id, nombre',
      configuracion: 'id',
    })
    await dbVieja.open()

    const habitoId = await dbVieja.table('habitos').add({
      nombre: 'Hábito viejo',
      icono: 'Sparkles',
      color: '#6366f1',
      categoriaId: null,
      fechaInicio: '2026-01-01',
      tipo: 'si_no',
      frecuencia: 'diaria',
      diasSemana: [],
      vecesPorDia: 1,
      recordatorio: false,
      prioridad: 'media',
      estado: 'activo',
      eliminado: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    const categoriaId = await dbVieja.table('categorias').add({
      nombre: 'Categoría vieja',
      color: '#ef4444',
      icono: 'HeartPulse',
      predefinida: false,
    })
    dbVieja.close()

    // Se reabre con la versión actual de la app (v1 + v2): debería disparar la migración automática.
    const dbNueva = new HabitosDB(nombre)
    await dbNueva.open()

    const habito = await dbNueva.habitos.get(habitoId as number)
    const categoria = await dbNueva.categorias.get(categoriaId as number)

    expect(habito?.uuid).toBeTypeOf('string')
    expect(habito?.uuid.length).toBeGreaterThan(0)
    expect(categoria?.uuid).toBeTypeOf('string')
    expect(categoria?.uuid.length).toBeGreaterThan(0)
    // no se pisan datos existentes durante la migración
    expect(habito?.nombre).toBe('Hábito viejo')

    await dbNueva.delete()
  })
})
