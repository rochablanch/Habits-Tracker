import type { NuevoHabito } from '../db/habitsRepo'
import { tipoUsaMeta, type DatosFormularioHabito } from './formTypes'

export type ErroresFormularioHabito = Partial<Record<keyof DatosFormularioHabito, string>>

export function validarHabito(datos: DatosFormularioHabito): ErroresFormularioHabito {
  const errores: ErroresFormularioHabito = {}

  const nombre = datos.nombre.trim()
  if (!nombre) {
    errores.nombre = 'Ponele un nombre al hábito.'
  } else if (nombre.length > 60) {
    errores.nombre = 'El nombre es demasiado largo (máximo 60 caracteres).'
  }

  if (!datos.fechaInicio) {
    errores.fechaInicio = 'Elegí una fecha de inicio.'
  }

  if (datos.frecuencia === 'dias_semana' && datos.diasSemana.length === 0) {
    errores.diasSemana = 'Elegí al menos un día de la semana.'
  }

  if (datos.frecuencia === 'x_veces_semana') {
    const veces = Number(datos.vecesPorSemana)
    if (!datos.vecesPorSemana || !Number.isInteger(veces) || veces < 1 || veces > 7) {
      errores.vecesPorSemana = 'Ingresá un número entre 1 y 7.'
    }
  }

  const vecesPorDia = Number(datos.vecesPorDia)
  if (!datos.vecesPorDia || !Number.isInteger(vecesPorDia) || vecesPorDia < 1) {
    errores.vecesPorDia = 'Ingresá al menos 1 vez por día.'
  }

  if (tipoUsaMeta(datos.tipo)) {
    const meta = Number(datos.metaCantidad)
    if (!datos.metaCantidad || !Number.isFinite(meta) || meta <= 0) {
      errores.metaCantidad = 'Ingresá una meta mayor a 0.'
    }
  }

  if (datos.recordatorio && !datos.horaPreferida) {
    errores.horaPreferida = 'Elegí una hora para poder activar el recordatorio.'
  }

  if (datos.notas.length > 500) {
    errores.notas = 'Las notas son demasiado largas (máximo 500 caracteres).'
  }

  return errores
}

export function formularioAHabito(datos: DatosFormularioHabito): Omit<NuevoHabito, 'estado'> {
  return {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim() || undefined,
    icono: datos.icono,
    color: datos.color,
    categoriaId: datos.categoriaId,
    fechaInicio: datos.fechaInicio,
    tipo: datos.tipo,
    frecuencia: datos.frecuencia,
    diasSemana: datos.frecuencia === 'dias_semana' ? datos.diasSemana : [],
    vecesPorSemana: datos.frecuencia === 'x_veces_semana' ? Number(datos.vecesPorSemana) : undefined,
    vecesPorDia: Number(datos.vecesPorDia) || 1,
    unidadMedida: datos.unidadMedida.trim() || undefined,
    metaCantidad: tipoUsaMeta(datos.tipo) ? Number(datos.metaCantidad) : undefined,
    horaPreferida: datos.horaPreferida || undefined,
    recordatorio: datos.recordatorio,
    prioridad: datos.prioridad,
    notas: datos.notas.trim() || undefined,
  }
}

export function habitoAFormulario(habito: {
  nombre: string
  descripcion?: string
  icono: string
  color: string
  categoriaId: number | null
  fechaInicio: string
  tipo: DatosFormularioHabito['tipo']
  frecuencia: DatosFormularioHabito['frecuencia']
  diasSemana: number[]
  vecesPorSemana?: number
  vecesPorDia: number
  unidadMedida?: string
  metaCantidad?: number
  horaPreferida?: string
  recordatorio: boolean
  prioridad: DatosFormularioHabito['prioridad']
  notas?: string
}): DatosFormularioHabito {
  return {
    nombre: habito.nombre,
    descripcion: habito.descripcion ?? '',
    icono: habito.icono,
    color: habito.color,
    categoriaId: habito.categoriaId,
    fechaInicio: habito.fechaInicio,
    tipo: habito.tipo,
    frecuencia: habito.frecuencia,
    diasSemana: habito.diasSemana,
    vecesPorSemana: habito.vecesPorSemana ? String(habito.vecesPorSemana) : '',
    vecesPorDia: String(habito.vecesPorDia),
    unidadMedida: habito.unidadMedida ?? '',
    metaCantidad: habito.metaCantidad ? String(habito.metaCantidad) : '',
    horaPreferida: habito.horaPreferida ?? '',
    recordatorio: habito.recordatorio,
    prioridad: habito.prioridad,
    notas: habito.notas ?? '',
  }
}
