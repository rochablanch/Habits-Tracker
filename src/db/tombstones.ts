import { db } from './db'
import type { TablaSincronizable } from './types'

/** Deja constancia local de que una fila se borró permanentemente, para poder avisarle al servidor si hay sincronización activa. */
export async function registrarEliminacion(uuid: string, tabla: TablaSincronizable): Promise<void> {
  await db.eliminaciones.add({ uuid, tabla, eliminadoEn: new Date().toISOString() })
}
