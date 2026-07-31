import { db } from '../db/db'
import { CONFIGURACION_POR_DEFECTO } from '../db/settingsRepo'
import type { Categoria, Configuracion, Habito, RegistroDiario } from '../db/types'
import { toISODate } from '../utils/date'

export const VERSION_RESPALDO = 1

export interface RespaldoDatos {
  version: number
  exportadoEn: string
  habitos: Habito[]
  registros: RegistroDiario[]
  categorias: Categoria[]
  configuracion: Configuracion
}

export async function construirRespaldo(): Promise<RespaldoDatos> {
  const [habitos, registros, categorias, configuracion] = await Promise.all([
    db.habitos.toArray(),
    db.registros.toArray(),
    db.categorias.toArray(),
    db.configuracion.get(1),
  ])

  return {
    version: VERSION_RESPALDO,
    exportadoEn: new Date().toISOString(),
    habitos,
    registros,
    categorias,
    configuracion: configuracion ?? CONFIGURACION_POR_DEFECTO,
  }
}

export function nombreArchivoRespaldo(fecha: Date = new Date()): string {
  return `habitos-backup-${toISODate(fecha)}.json`
}

function esTexto(v: unknown): v is string {
  return typeof v === 'string'
}

function esHabitoValido(x: unknown): x is Habito {
  if (typeof x !== 'object' || x === null) return false
  const h = x as Record<string, unknown>
  return (
    typeof h.id === 'number' &&
    esTexto(h.nombre) &&
    esTexto(h.icono) &&
    esTexto(h.color) &&
    esTexto(h.fechaInicio) &&
    esTexto(h.tipo) &&
    esTexto(h.frecuencia) &&
    Array.isArray(h.diasSemana) &&
    typeof h.vecesPorDia === 'number' &&
    esTexto(h.estado) &&
    typeof h.eliminado === 'boolean' &&
    esTexto(h.createdAt) &&
    esTexto(h.updatedAt)
  )
}

function esRegistroValido(x: unknown): x is RegistroDiario {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === 'number' &&
    typeof r.habitoId === 'number' &&
    esTexto(r.fecha) &&
    (r.estado === 'completado' || r.estado === 'omitido') &&
    esTexto(r.createdAt) &&
    esTexto(r.updatedAt)
  )
}

function esCategoriaValida(x: unknown): x is Categoria {
  if (typeof x !== 'object' || x === null) return false
  const c = x as Record<string, unknown>
  return typeof c.id === 'number' && esTexto(c.nombre) && esTexto(c.color) && esTexto(c.icono)
}

function esConfiguracionValida(x: unknown): x is Configuracion {
  if (typeof x !== 'object' || x === null) return false
  const c = x as Record<string, unknown>
  return (
    c.id === 1 &&
    (c.primerDiaSemana === 0 || c.primerDiaSemana === 1) &&
    esTexto(c.formatoFecha) &&
    typeof c.animaciones === 'boolean' &&
    typeof c.frasesMotivacionales === 'boolean' &&
    typeof c.recordatoriosActivos === 'boolean'
  )
}

/** Valida la forma del archivo antes de restaurar nada. Devuelve los datos tipados si es válido, o null si no. */
export function validarRespaldo(datos: unknown): RespaldoDatos | null {
  if (typeof datos !== 'object' || datos === null) return null
  const d = datos as Record<string, unknown>

  if (d.version !== VERSION_RESPALDO) return null
  if (!esTexto(d.exportadoEn)) return null
  if (!Array.isArray(d.habitos) || !d.habitos.every(esHabitoValido)) return null
  if (!Array.isArray(d.registros) || !d.registros.every(esRegistroValido)) return null
  if (!Array.isArray(d.categorias) || !d.categorias.every(esCategoriaValida)) return null
  if (!esConfiguracionValida(d.configuracion)) return null

  return d as unknown as RespaldoDatos
}

/** A los registros de un respaldo exportado antes de que existiera "uuid" se les asigna uno nuevo al restaurar. */
function conUuid<T extends { uuid?: string }>(items: T[]): (T & { uuid: string })[] {
  return items.map((item) => ({ ...item, uuid: item.uuid ?? crypto.randomUUID() }))
}

/** Reemplaza todos los datos actuales por los del respaldo. Irreversible salvo que se haya guardado una copia antes. */
export async function restaurarRespaldo(datos: RespaldoDatos): Promise<void> {
  await db.transaction('rw', db.habitos, db.registros, db.categorias, db.configuracion, async () => {
    await db.habitos.clear()
    await db.registros.clear()
    await db.categorias.clear()
    await db.configuracion.clear()

    if (datos.categorias.length > 0) await db.categorias.bulkAdd(conUuid(datos.categorias))
    if (datos.habitos.length > 0) await db.habitos.bulkAdd(conUuid(datos.habitos))
    if (datos.registros.length > 0) await db.registros.bulkAdd(conUuid(datos.registros))
    // Se combina con los valores por defecto por si el respaldo es de una versión anterior de la app.
    await db.configuracion.add({ ...CONFIGURACION_POR_DEFECTO, ...datos.configuracion })
  })
}
