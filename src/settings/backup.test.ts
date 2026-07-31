import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { crearHabito } from '../db/habitsRepo'
import { registrarCumplimiento } from '../db/logsRepo'
import type { NuevoHabito } from '../db/habitsRepo'
import { construirRespaldo, nombreArchivoRespaldo, restaurarRespaldo, validarRespaldo, VERSION_RESPALDO } from './backup'

afterEach(async () => {
  await Promise.all([db.habitos.clear(), db.registros.clear(), db.categorias.clear(), db.configuracion.clear()])
})

function habitoDeEjemplo(): NuevoHabito {
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
  }
}

describe('construirRespaldo / validarRespaldo', () => {
  it('un respaldo recién construido es válido', async () => {
    const id = await crearHabito(habitoDeEjemplo())
    await registrarCumplimiento(id, '2026-07-28', { estado: 'completado' })

    const respaldo = await construirRespaldo()
    expect(respaldo.version).toBe(VERSION_RESPALDO)
    expect(respaldo.habitos).toHaveLength(1)
    expect(respaldo.registros).toHaveLength(1)

    expect(validarRespaldo(respaldo)).not.toBeNull()
  })

  it('rechaza un archivo sin la forma esperada', () => {
    expect(validarRespaldo(null)).toBeNull()
    expect(validarRespaldo({})).toBeNull()
    expect(validarRespaldo({ version: 999, habitos: [], registros: [], categorias: [], configuracion: {} })).toBeNull()
    expect(validarRespaldo('no es un objeto')).toBeNull()
  })

  it('rechaza un respaldo con un hábito corrupto', () => {
    const invalido = {
      version: VERSION_RESPALDO,
      exportadoEn: new Date().toISOString(),
      habitos: [{ nombre: 'Sin id ni resto de campos' }],
      registros: [],
      categorias: [],
      configuracion: {
        id: 1,
        primerDiaSemana: 1,
        formatoFecha: 'DD/MM/YYYY',
        animaciones: true,
        frasesMotivacionales: true,
        recordatoriosActivos: true,
      },
    }
    expect(validarRespaldo(invalido)).toBeNull()
  })
})

describe('restaurarRespaldo', () => {
  it('reemplaza todos los datos actuales por los del respaldo', async () => {
    // datos actuales, distintos a los del respaldo
    await crearHabito(habitoDeEjemplo())

    const respaldo = {
      version: VERSION_RESPALDO,
      exportadoEn: new Date().toISOString(),
      habitos: [
        {
          id: 5,
          uuid: 'habito-uuid-5',
          nombre: 'Leer',
          descripcion: undefined,
          icono: 'BookOpen',
          color: '#8b5cf6',
          categoriaId: null,
          fechaInicio: '2026-01-01',
          tipo: 'si_no' as const,
          frecuencia: 'diaria' as const,
          diasSemana: [],
          vecesPorDia: 1,
          recordatorio: false,
          prioridad: 'media' as const,
          estado: 'activo' as const,
          eliminado: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      registros: [
        {
          id: 9,
          uuid: 'registro-uuid-9',
          habitoId: 5,
          fecha: '2026-01-02',
          estado: 'completado' as const,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      categorias: [{ id: 3, uuid: 'cat-uuid-3', nombre: 'Estudio', color: '#8b5cf6', icono: 'BookOpen', predefinida: true }],
      configuracion: {
        id: 1 as const,
        primerDiaSemana: 0 as const,
        formatoFecha: 'MM/DD/YYYY',
        animaciones: false,
        frasesMotivacionales: false,
        recordatoriosActivos: false,
        onboardingCompletado: true,
      },
    }

    await restaurarRespaldo(respaldo)

    const habitos = await db.habitos.toArray()
    const registros = await db.registros.toArray()
    const categorias = await db.categorias.toArray()
    const configuracion = await db.configuracion.get(1)

    expect(habitos).toHaveLength(1)
    expect(habitos[0].nombre).toBe('Leer')
    expect(habitos[0].id).toBe(5) // conserva el id original, no genera uno nuevo
    expect(registros).toHaveLength(1)
    expect(categorias.map((c) => c.nombre)).toEqual(['Estudio'])
    expect(configuracion?.primerDiaSemana).toBe(0)
  })

  it('a un respaldo exportado antes de que existiera "uuid" se le asigna uno al restaurar', async () => {
    const respaldoViejo = {
      version: VERSION_RESPALDO,
      exportadoEn: new Date().toISOString(),
      habitos: [
        {
          id: 7,
          nombre: 'Hábito de un respaldo viejo',
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
        },
      ],
      registros: [],
      categorias: [],
      configuracion: {
        id: 1,
        primerDiaSemana: 1,
        formatoFecha: 'DD/MM/YYYY',
        animaciones: true,
        frasesMotivacionales: true,
        recordatoriosActivos: true,
      },
    }

    const validado = validarRespaldo(respaldoViejo)
    expect(validado).not.toBeNull() // sigue aceptando el archivo viejo, no lo rechaza

    await restaurarRespaldo(validado!)

    const [habito] = await db.habitos.toArray()
    expect(habito.uuid).toBeTypeOf('string')
    expect(habito.uuid.length).toBeGreaterThan(0)
  })
})

describe('nombreArchivoRespaldo', () => {
  it('incluye la fecha en formato YYYY-MM-DD', () => {
    expect(nombreArchivoRespaldo(new Date(2026, 6, 28))).toBe('habitos-backup-2026-07-28.json')
  })
})
