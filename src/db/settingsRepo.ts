import { db } from './db'
import type { Configuracion } from './types'

export const CONFIGURACION_POR_DEFECTO: Configuracion = {
  id: 1,
  primerDiaSemana: 1,
  formatoFecha: 'DD/MM/YYYY',
  animaciones: true,
  frasesMotivacionales: true,
  recordatoriosActivos: true,
}

export async function obtenerConfiguracion(): Promise<Configuracion> {
  const config = await db.configuracion.get(1)
  return config ?? CONFIGURACION_POR_DEFECTO
}

export async function actualizarConfiguracion(cambios: Partial<Omit<Configuracion, 'id'>>): Promise<void> {
  const actual = await obtenerConfiguracion()
  await db.configuracion.put({ ...actual, ...cambios })
}
