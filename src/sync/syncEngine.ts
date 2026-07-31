import { db } from '../db/db'
import type { TablaSincronizable } from '../db/types'
import {
  categoriaARemoto,
  habitoARemoto,
  registroARemoto,
  remotoACategoria,
  remotoAHabito,
  remotoARegistro,
  remotoEsMasNuevo,
  type CategoriaRemota,
  type HabitoRemoto,
  type RegistroRemoto,
} from './mapping'
import { supabase } from './supabaseClient'

const CLAVE_ULTIMA_SYNC = 'habitos-tracker-ultima-sync'
const CLAVE_SYNC_USER_ID = 'habitos-tracker-sync-user-id'
const EPOCA = '1970-01-01T00:00:00.000Z'

function obtenerUltimaSync(): string {
  return localStorage.getItem(CLAVE_ULTIMA_SYNC) ?? EPOCA
}

function guardarUltimaSync(fecha: string): void {
  localStorage.setItem(CLAVE_ULTIMA_SYNC, fecha)
}

/**
 * Este dispositivo (mejor dicho, este navegador) puede haber sincronizado antes con otra
 * cuenta. Mezclar los datos locales de dos personas sería un error grave de privacidad,
 * así que ante la duda no se sincroniza nada hasta que el usuario borre los datos locales.
 */
function verificarMismaCuenta(userId: string): void {
  const anterior = localStorage.getItem(CLAVE_SYNC_USER_ID)
  if (anterior && anterior !== userId) {
    throw new Error(
      'Este dispositivo ya sincronizó datos de otra cuenta. Para usar esta cuenta acá, primero borrá los datos locales en Configuración → Zona de riesgo.',
    )
  }
}

/** Sincroniza categorías, hábitos y registros con Supabase. Lanza una excepción si algo falla. */
export async function sincronizar(userId: string): Promise<void> {
  verificarMismaCuenta(userId)

  const desde = obtenerUltimaSync()
  const ahora = new Date().toISOString()

  // Primero lo que borraron en otros dispositivos, y en ese orden: tombstones antes que
  // datos, para no volver a insertar algo que se acaba de borrar (ver CLAUDE.md).
  await pullEliminaciones(desde)
  await pullCategorias(desde)
  await pullHabitos(desde)
  await pullRegistros(desde)

  // Después lo que se borró/creó/editó acá: tombstones antes que datos, por la misma razón
  // (ej. "Borrar todos los datos" borra y vuelve a sembrar las categorías predefinidas).
  await pushEliminaciones(userId)
  await pushCategorias(userId)
  await pushHabitos(userId, desde)
  await pushRegistros(userId, desde)

  guardarUltimaSync(ahora)
  localStorage.setItem(CLAVE_SYNC_USER_ID, userId)
}

async function pullEliminaciones(desde: string): Promise<void> {
  const { data, error } = await supabase.from('tombstones').select('uuid, tabla, eliminado_en').gt('eliminado_en', desde)
  if (error) throw new Error(error.message)

  for (const t of data ?? []) {
    await borrarLocalPorUuid(t.tabla as TablaSincronizable, t.uuid)
  }
}

async function borrarLocalPorUuid(tabla: TablaSincronizable, uuid: string): Promise<void> {
  if (tabla === 'habitos') await db.habitos.where('uuid').equals(uuid).delete()
  else if (tabla === 'registros') await db.registros.where('uuid').equals(uuid).delete()
  else await db.categorias.where('uuid').equals(uuid).delete()
}

async function pullCategorias(desde: string): Promise<void> {
  const { data, error } = await supabase.from('categorias').select('*').gt('updated_at', desde)
  if (error) throw new Error(error.message)

  for (const remota of (data ?? []) as CategoriaRemota[]) {
    const local = await db.categorias.where('uuid').equals(remota.uuid).first()
    const datos = remotoACategoria(remota)
    if (local) {
      await db.categorias.update(local.id, datos)
    } else {
      await db.categorias.add(datos)
    }
  }
}

async function pullHabitos(desde: string): Promise<void> {
  const { data, error } = await supabase.from('habitos').select('*').gt('updated_at', desde)
  if (error) throw new Error(error.message)

  for (const remoto of (data ?? []) as HabitoRemoto[]) {
    let categoriaId: number | null = null
    if (remoto.categoria_uuid) {
      const categoriaLocal = await db.categorias.where('uuid').equals(remoto.categoria_uuid).first()
      categoriaId = categoriaLocal?.id ?? null
    }
    const datos = remotoAHabito(remoto, categoriaId)
    const local = await db.habitos.where('uuid').equals(remoto.uuid).first()
    if (local) {
      if (remotoEsMasNuevo(local.updatedAt, remoto.updated_at)) {
        await db.habitos.update(local.id, datos)
      }
    } else {
      await db.habitos.add(datos)
    }
  }
}

async function pullRegistros(desde: string): Promise<void> {
  const { data, error } = await supabase.from('registros').select('*').gt('updated_at', desde)
  if (error) throw new Error(error.message)

  for (const remoto of (data ?? []) as RegistroRemoto[]) {
    const habitoLocal = await db.habitos.where('uuid').equals(remoto.habito_uuid).first()
    // El hábito debería haber llegado en pullHabitos (se procesa antes); si no está, se
    // resuelve solo en la próxima sincronización.
    if (!habitoLocal) continue

    const datos = remotoARegistro(remoto, habitoLocal.id)
    const local = await db.registros.where('uuid').equals(remoto.uuid).first()
    if (local) {
      if (remotoEsMasNuevo(local.updatedAt, remoto.updated_at)) {
        await db.registros.update(local.id, datos)
      }
    } else {
      await db.registros.add(datos)
    }
  }
}

async function pushEliminaciones(userId: string): Promise<void> {
  const pendientes = await db.eliminaciones.toArray()
  for (const e of pendientes) {
    const { error: errorBorrado } = await supabase.from(e.tabla).delete().eq('uuid', e.uuid)
    if (errorBorrado) throw new Error(errorBorrado.message)

    const { error: errorTombstone } = await supabase
      .from('tombstones')
      .upsert({ uuid: e.uuid, user_id: userId, tabla: e.tabla, eliminado_en: e.eliminadoEn }, { onConflict: 'uuid' })
    if (errorTombstone) throw new Error(errorTombstone.message)

    await db.eliminaciones.delete(e.id)
  }
}

// Las categorías son pocas (decenas, no miles): se empujan todas en cada sincronización en
// vez de llevar un rastro de "cuáles cambiaron" (no tienen updatedAt local, ver CLAUDE.md).
async function pushCategorias(userId: string): Promise<void> {
  const categorias = await db.categorias.toArray()
  if (categorias.length === 0) return
  const filas = categorias.map((c) => categoriaARemoto(c, userId))
  const { error } = await supabase.from('categorias').upsert(filas, { onConflict: 'uuid' })
  if (error) throw new Error(error.message)
}

async function pushHabitos(userId: string, desde: string): Promise<void> {
  const habitos = await db.habitos.filter((h) => h.updatedAt > desde).toArray()
  if (habitos.length === 0) return

  const filas = await Promise.all(
    habitos.map(async (h) => {
      const categoriaUuid = h.categoriaId ? (await db.categorias.get(h.categoriaId))?.uuid ?? null : null
      return habitoARemoto(h, userId, categoriaUuid)
    }),
  )
  const { error } = await supabase.from('habitos').upsert(filas, { onConflict: 'uuid' })
  if (error) throw new Error(error.message)
}

async function pushRegistros(userId: string, desde: string): Promise<void> {
  const registros = await db.registros.filter((r) => r.updatedAt > desde).toArray()
  if (registros.length === 0) return

  const filas: RegistroRemoto[] = []
  for (const r of registros) {
    const habito = await db.habitos.get(r.habitoId)
    if (!habito) continue // el hábito se borró localmente justo antes de sincronizar
    filas.push(registroARemoto(r, userId, habito.uuid))
  }
  if (filas.length === 0) return

  const { error } = await supabase.from('registros').upsert(filas, { onConflict: 'uuid' })
  if (error) throw new Error(error.message)
}
