/**
 * Modelo de datos de la aplicación.
 *
 * Un Hábito (definición) y sus RegistroDiario (cumplimiento día a día) son
 * entidades separadas a propósito: permite archivar o eliminar un hábito sin
 * destruir su historial, y facilita agregar sincronización entre
 * dispositivos en el futuro sin rediseñar el modelo.
 */

export type EstadoHabito = 'activo' | 'pausado' | 'archivado'

/** Tipos de hábito soportados, ver CLAUDE.md para ejemplos de cada uno. */
export type TipoHabito =
  | 'si_no' // "Medité hoy": se cumple o no.
  | 'cantidad' // "Bebí 8 vasos de agua": se registra una cantidad contra una meta.
  | 'tiempo' // "Leí 20 minutos": se registran minutos contra una meta.
  | 'limite_maximo' // "Máximo 3 operaciones": se registra una cantidad que no debe superar la meta.
  | 'evitar' // "No consumí alcohol": se cumple evitando la acción.

export type Frecuencia =
  | 'diaria'
  | 'dias_semana' // usa diasSemana
  | 'x_veces_semana' // usa vecesPorSemana

export type Prioridad = 'baja' | 'media' | 'alta'

export interface Habito {
  id: number
  nombre: string
  descripcion?: string
  icono: string
  color: string
  categoriaId: number | null
  fechaInicio: string // YYYY-MM-DD
  tipo: TipoHabito
  frecuencia: Frecuencia
  /** 0 = domingo … 6 = sábado. Solo aplica si frecuencia === 'dias_semana'. */
  diasSemana: number[]
  /** Solo aplica si frecuencia === 'x_veces_semana'. */
  vecesPorSemana?: number
  vecesPorDia: number
  unidadMedida?: string
  metaCantidad?: number
  horaPreferida?: string // HH:mm
  recordatorio: boolean
  prioridad: Prioridad
  notas?: string
  estado: EstadoHabito
  /** Borrado suave: si es true, el hábito no aparece en ninguna lista activa, pero sus registros se conservan. */
  eliminado: boolean
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
}

export type EstadoRegistro = 'completado' | 'omitido'

export interface RegistroDiario {
  id: number
  habitoId: number
  fecha: string // YYYY-MM-DD
  estado: EstadoRegistro
  /** Cantidad o minutos, según el tipo de hábito. */
  valor?: number
  motivoOmision?: string
  nota?: string
  createdAt: string
  updatedAt: string
}

export interface Categoria {
  id: number
  nombre: string
  color: string
  icono: string
  predefinida: boolean
}

export interface Configuracion {
  id: 1
  primerDiaSemana: 0 | 1 // 0 = domingo, 1 = lunes
  formatoFecha: string
  animaciones: boolean
  frasesMotivacionales: boolean
  recordatoriosActivos: boolean
  /** Si ya vio (o saltó) la introducción inicial. Controla si se muestra el onboarding. */
  onboardingCompletado: boolean
}
