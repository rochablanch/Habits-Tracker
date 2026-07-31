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
 * actualiza en el momento. Todo ocurre dentro de una única transacción para
 * que llamadas simultáneas (ej. varios taps seguidos) no se pisen entre sí.
 */
export async function registrarCumplimiento(
  habitoId: number,
  fecha: string,
  datos: DatosRegistro,
): Promise<number> {
  return db.transaction('rw', db.registros, async () => {
    const existente = await db.registros.where('[habitoId+fecha]').equals([habitoId, fecha]).first()
    const ahora = new Date().toISOString()

    if (existente) {
      await db.registros.update(existente.id, { ...datos, updatedAt: ahora })
      return existente.id
    }

    return db.registros.add({
      uuid: crypto.randomUUID(),
      habitoId,
      fecha,
      ...datos,
      createdAt: ahora,
      updatedAt: ahora,
    })
  })
}

/**
 * Suma (o resta) una cantidad al registro del día, leyendo siempre el valor
 * actual desde la base de datos (no desde el estado de la pantalla) para que
 * taps rápidos y seguidos en +/- se acumulen correctamente. Si el resultado
 * llega a 0, se quita el registro (vuelve a pendiente).
 */
export async function incrementarRegistro(habitoId: number, fecha: string, delta: number): Promise<void> {
  await db.transaction('rw', db.registros, async () => {
    const existente = await db.registros.where('[habitoId+fecha]').equals([habitoId, fecha]).first()
    const nuevoValor = (existente?.valor ?? 0) + delta
    const ahora = new Date().toISOString()

    if (nuevoValor <= 0) {
      if (existente) await db.registros.delete(existente.id)
      return
    }

    if (existente) {
      await db.registros.update(existente.id, { valor: nuevoValor, estado: 'completado', updatedAt: ahora })
    } else {
      await db.registros.add({
        uuid: crypto.randomUUID(),
        habitoId,
        fecha,
        estado: 'completado',
        valor: nuevoValor,
        createdAt: ahora,
        updatedAt: ahora,
      })
    }
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

/** Registros de todos los hábitos dentro de un rango de fechas (ambos extremos incluidos). */
export async function listarRegistrosEnRango(desde: string, hasta: string): Promise<RegistroDiario[]> {
  return db.registros.where('fecha').between(desde, hasta, true, true).toArray()
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
