import type { NuevoHabito } from '../db/habitsRepo'
import type { Categoria, Frecuencia, TipoHabito } from '../db/types'

export interface HabitoSugerido {
  nombre: string
  icono: string
  color: string
  /** Nombre de una categoría predefinida (ver defaultCategories.ts); se resuelve a su id al crear el hábito. */
  categoriaNombre: string
  tipo: TipoHabito
  frecuencia: Frecuencia
  diasSemana: number[]
  vecesPorSemana?: number
  metaCantidad?: number
  unidadMedida?: string
  resumen: string
}

export const HABITOS_SUGERIDOS: HabitoSugerido[] = [
  {
    nombre: 'Beber agua',
    icono: 'GlassWater',
    color: '#0ea5e9',
    categoriaNombre: 'Salud',
    tipo: 'cantidad',
    frecuencia: 'diaria',
    diasSemana: [],
    metaCantidad: 8,
    unidadMedida: 'vasos',
    resumen: '8 vasos por día',
  },
  {
    nombre: 'Meditar',
    icono: 'Brain',
    color: '#8b5cf6',
    categoriaNombre: 'Bienestar',
    tipo: 'si_no',
    frecuencia: 'diaria',
    diasSemana: [],
    resumen: 'Todos los días',
  },
  {
    nombre: 'Entrenar',
    icono: 'Dumbbell',
    color: '#f97316',
    categoriaNombre: 'Ejercicio',
    tipo: 'si_no',
    frecuencia: 'dias_semana',
    diasSemana: [1, 3, 5],
    resumen: 'Lunes, miércoles y viernes',
  },
  {
    nombre: 'Leer',
    icono: 'BookOpen',
    color: '#6366f1',
    categoriaNombre: 'Estudio',
    tipo: 'tiempo',
    frecuencia: 'diaria',
    diasSemana: [],
    metaCantidad: 20,
    unidadMedida: 'minutos',
    resumen: '20 minutos por día',
  },
  {
    nombre: 'Dormir temprano',
    icono: 'Bed',
    color: '#64748b',
    categoriaNombre: 'Salud',
    tipo: 'si_no',
    frecuencia: 'diaria',
    diasSemana: [],
    resumen: 'Todos los días',
  },
  {
    nombre: 'Planificar el día',
    icono: 'PenLine',
    color: '#0ea5e9',
    categoriaNombre: 'Productividad',
    tipo: 'si_no',
    frecuencia: 'diaria',
    diasSemana: [],
    resumen: 'Todos los días',
  },
  {
    nombre: 'Ahorrar',
    icono: 'PiggyBank',
    color: '#14b8a6',
    categoriaNombre: 'Finanzas',
    tipo: 'si_no',
    frecuencia: 'x_veces_semana',
    diasSemana: [],
    vecesPorSemana: 3,
    resumen: '3 veces por semana',
  },
  {
    nombre: 'Estudiar inglés',
    icono: 'Languages',
    color: '#8b5cf6',
    categoriaNombre: 'Estudio',
    tipo: 'si_no',
    frecuencia: 'x_veces_semana',
    diasSemana: [],
    vecesPorSemana: 5,
    resumen: '5 veces por semana',
  },
  {
    nombre: 'No fumar',
    icono: 'CigaretteOff',
    color: '#ef4444',
    categoriaNombre: 'Bienestar',
    tipo: 'evitar',
    frecuencia: 'diaria',
    diasSemana: [],
    resumen: 'Todos los días',
  },
]

/** Convierte un hábito sugerido en los datos que espera `crearHabito`, resolviendo su categoría por nombre. */
export function resolverHabitoSugerido(
  sugerido: HabitoSugerido,
  categorias: Categoria[],
  fechaInicio: string,
): NuevoHabito {
  return {
    nombre: sugerido.nombre,
    icono: sugerido.icono,
    color: sugerido.color,
    categoriaId: categorias.find((c) => c.nombre === sugerido.categoriaNombre)?.id ?? null,
    fechaInicio,
    tipo: sugerido.tipo,
    frecuencia: sugerido.frecuencia,
    diasSemana: sugerido.diasSemana,
    vecesPorSemana: sugerido.vecesPorSemana,
    vecesPorDia: 1,
    metaCantidad: sugerido.metaCantidad,
    unidadMedida: sugerido.unidadMedida,
    recordatorio: false,
    prioridad: 'media',
    estado: 'activo',
  }
}
