import type { Categoria, Habito, RegistroDiario } from '../db/types'

export interface HabitoRemoto {
  uuid: string
  user_id: string
  categoria_uuid: string | null
  nombre: string
  descripcion: string | null
  icono: string
  color: string
  fecha_inicio: string
  tipo: string
  frecuencia: string
  dias_semana: number[]
  veces_por_semana: number | null
  veces_por_dia: number
  unidad_medida: string | null
  meta_cantidad: number | null
  hora_preferida: string | null
  recordatorio: boolean
  prioridad: string
  notas: string | null
  estado: string
  eliminado: boolean
  created_at: string
  updated_at: string
}

export interface RegistroRemoto {
  uuid: string
  user_id: string
  habito_uuid: string
  fecha: string
  estado: string
  valor: number | null
  motivo_omision: string | null
  nota: string | null
  created_at: string
  updated_at: string
}

export interface CategoriaRemota {
  uuid: string
  user_id: string
  nombre: string
  color: string
  icono: string
  predefinida: boolean
  updated_at: string
}

export function habitoARemoto(h: Habito, userId: string, categoriaUuid: string | null): HabitoRemoto {
  return {
    uuid: h.uuid,
    user_id: userId,
    categoria_uuid: categoriaUuid,
    nombre: h.nombre,
    descripcion: h.descripcion ?? null,
    icono: h.icono,
    color: h.color,
    fecha_inicio: h.fechaInicio,
    tipo: h.tipo,
    frecuencia: h.frecuencia,
    dias_semana: h.diasSemana,
    veces_por_semana: h.vecesPorSemana ?? null,
    veces_por_dia: h.vecesPorDia,
    unidad_medida: h.unidadMedida ?? null,
    meta_cantidad: h.metaCantidad ?? null,
    hora_preferida: h.horaPreferida ?? null,
    recordatorio: h.recordatorio,
    prioridad: h.prioridad,
    notas: h.notas ?? null,
    estado: h.estado,
    eliminado: h.eliminado,
    created_at: h.createdAt,
    updated_at: h.updatedAt,
  }
}

export function remotoAHabito(r: HabitoRemoto, categoriaId: number | null): Omit<Habito, 'id'> {
  return {
    uuid: r.uuid,
    nombre: r.nombre,
    descripcion: r.descripcion ?? undefined,
    icono: r.icono,
    color: r.color,
    categoriaId,
    fechaInicio: r.fecha_inicio,
    tipo: r.tipo as Habito['tipo'],
    frecuencia: r.frecuencia as Habito['frecuencia'],
    diasSemana: r.dias_semana,
    vecesPorSemana: r.veces_por_semana ?? undefined,
    vecesPorDia: r.veces_por_dia,
    unidadMedida: r.unidad_medida ?? undefined,
    metaCantidad: r.meta_cantidad ?? undefined,
    horaPreferida: r.hora_preferida ?? undefined,
    recordatorio: r.recordatorio,
    prioridad: r.prioridad as Habito['prioridad'],
    notas: r.notas ?? undefined,
    estado: r.estado as Habito['estado'],
    eliminado: r.eliminado,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function registroARemoto(r: RegistroDiario, userId: string, habitoUuid: string): RegistroRemoto {
  return {
    uuid: r.uuid,
    user_id: userId,
    habito_uuid: habitoUuid,
    fecha: r.fecha,
    estado: r.estado,
    valor: r.valor ?? null,
    motivo_omision: r.motivoOmision ?? null,
    nota: r.nota ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }
}

export function remotoARegistro(r: RegistroRemoto, habitoId: number): Omit<RegistroDiario, 'id'> {
  return {
    uuid: r.uuid,
    habitoId,
    fecha: r.fecha,
    estado: r.estado as RegistroDiario['estado'],
    valor: r.valor ?? undefined,
    motivoOmision: r.motivo_omision ?? undefined,
    nota: r.nota ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function categoriaARemoto(c: Categoria, userId: string): Omit<CategoriaRemota, 'updated_at'> {
  return {
    uuid: c.uuid,
    user_id: userId,
    nombre: c.nombre,
    color: c.color,
    icono: c.icono,
    predefinida: c.predefinida,
  }
}

export function remotoACategoria(c: CategoriaRemota): Omit<Categoria, 'id'> {
  return {
    uuid: c.uuid,
    nombre: c.nombre,
    color: c.color,
    icono: c.icono,
    predefinida: c.predefinida,
  }
}

/** "Última escritura gana": compara los momentos de edición, no de llegada al servidor. */
export function remotoEsMasNuevo(localUpdatedAt: string, remoteUpdatedAt: string): boolean {
  return new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime()
}
