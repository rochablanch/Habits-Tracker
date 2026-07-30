import { db } from './db'
import type { Configuracion } from './types'

export const CONFIGURACION_POR_DEFECTO: Configuracion = {
  id: 1,
  primerDiaSemana: 1,
  formatoFecha: 'DD/MM/YYYY',
  animaciones: true,
  frasesMotivacionales: true,
  recordatoriosActivos: true,
  onboardingCompletado: false,
}

export async function obtenerConfiguracion(): Promise<Configuracion> {
  const config = await db.configuracion.get(1)
  // Se combina con los valores por defecto para cubrir campos que se hayan agregado
  // después de que el usuario ya tuviera una configuración guardada.
  return { ...CONFIGURACION_POR_DEFECTO, ...config }
}

export async function actualizarConfiguracion(cambios: Partial<Omit<Configuracion, 'id'>>): Promise<void> {
  const actual = await obtenerConfiguracion()
  await db.configuracion.put({ ...actual, ...cambios })
}
