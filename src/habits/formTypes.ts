import type { Frecuencia, Prioridad, TipoHabito } from '../db/types'

/** Estado del formulario mientras se edita: los campos numéricos quedan como texto para permitir un input vacío temporal. */
export interface DatosFormularioHabito {
  nombre: string
  descripcion: string
  icono: string
  color: string
  categoriaId: number | null
  fechaInicio: string
  tipo: TipoHabito
  frecuencia: Frecuencia
  diasSemana: number[]
  vecesPorSemana: string
  vecesPorDia: string
  unidadMedida: string
  metaCantidad: string
  horaPreferida: string
  recordatorio: boolean
  prioridad: Prioridad
  notas: string
}

export const TIPOS_HABITO: { value: TipoHabito; label: string; ayuda: string }[] = [
  { value: 'si_no', label: 'Sí / No', ayuda: 'Se cumple o no cada día. Ej: "Medité hoy".' },
  { value: 'cantidad', label: 'Cantidad', ayuda: 'Registrás una cantidad contra una meta. Ej: "8 vasos de agua".' },
  { value: 'tiempo', label: 'Tiempo', ayuda: 'Registrás minutos contra una meta. Ej: "Leer 20 minutos".' },
  { value: 'limite_maximo', label: 'Límite máximo', ayuda: 'No debe superar una cantidad. Ej: "Máximo 3 operaciones".' },
  { value: 'evitar', label: 'Evitar', ayuda: 'Se cumple evitando la acción. Ej: "No consumí alcohol".' },
]

export const FRECUENCIAS: { value: Frecuencia; label: string }[] = [
  { value: 'diaria', label: 'Todos los días' },
  { value: 'dias_semana', label: 'Días específicos de la semana' },
  { value: 'x_veces_semana', label: 'Cierta cantidad de veces por semana' },
]

export const PRIORIDADES: { value: Prioridad; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
]

/** Lunes a domingo, con el valor interno de Date.getDay() (0=domingo). */
export const DIAS_SEMANA: { value: number; label: string }[] = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'M' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
]

export function tipoUsaMeta(tipo: TipoHabito): boolean {
  return tipo === 'cantidad' || tipo === 'tiempo' || tipo === 'limite_maximo'
}
