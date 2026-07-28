import { db } from './db'
import type { EstadoRegistro, RegistroDiario } from './types'

export interface DatosRegistro {
  estado: EstadoRegistro
  valor?: number
  motivoOmision?: string
  nota?: string
}

/**
 * Crea o actualiza el registro de un hábito en una fecha (upsert). Nunca
 * genera un duplicado: si ya existe un registro para ese hábito y fecha, lo
 * actualiza en el momento.
 */
export async function registrarCumplimiento(
  habitoId: number,
  fecha: string,
  datos: DatosRegistro,
): Promise<number> {
  const existente = await db.registros.where('[habitoId+fecha]').equals([habitoId, fecha]).first()
  const ahora = new Date().toISOString()

  if (existente) {
    await db.registros.update(existente.id!, { ...datos, updatedAt: ahora })
    return existente.id!
  }

  return db.registros.add({
    habitoId,
    fecha,
    ...datos,
    createdAt: ahora,
    updatedAt: ahora,
  })
}

/** "Desmarcar": vuelve el día a pendiente, quitando cualquier registro guardado. */
export async function quitarRegistro(habitoId: number, fecha: string): Promise<void> {
  await db.registros.where('[habitoId+fecha]').equals([habitoId, fecha]).delete()
}

export async function obtenerRegistro(habitoId: number, fecha: string): Promise<RegistroDiario | undefined> {
  return db.registros.where('[habitoId+fecha]').equals([habitoId, fecha]).first()
}

export async function listarRegistrosPorFecha(fecha: string): Promise<RegistroDiario[]> {
  return db.registros.where('fecha').equals(fecha).toArray()
}

export async function listarRegistrosPorHabito(
  habitoId: number,
  rango?: { desde?: string; hasta?: string },
): Promise<RegistroDiario[]> {
  const registros = await db.registros.where('habitoId').equals(habitoId).toArray()
  if (!rango) return registros
  return registros.filter(
    (r) => (!rango.desde || r.fecha >= rango.desde) && (!rango.hasta || r.fecha <= rango.hasta),
  )
}
