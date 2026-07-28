import type { Categoria } from './types'

/** Categorías sugeridas al iniciar. El usuario puede editarlas o eliminarlas libremente. */
export const CATEGORIAS_PREDEFINIDAS: Omit<Categoria, 'id'>[] = [
  { nombre: 'Salud', color: '#ef4444', icono: 'HeartPulse', predefinida: true },
  { nombre: 'Ejercicio', color: '#f97316', icono: 'Dumbbell', predefinida: true },
  { nombre: 'Alimentación', color: '#84cc16', icono: 'Apple', predefinida: true },
  { nombre: 'Productividad', color: '#0ea5e9', icono: 'ListChecks', predefinida: true },
  { nombre: 'Trabajo', color: '#6366f1', icono: 'Briefcase', predefinida: true },
  { nombre: 'Finanzas', color: '#14b8a6', icono: 'Wallet', predefinida: true },
  { nombre: 'Trading', color: '#059669', icono: 'TrendingUp', predefinida: true },
  { nombre: 'Estudio', color: '#8b5cf6', icono: 'BookOpen', predefinida: true },
  { nombre: 'Bienestar', color: '#ec4899', icono: 'Leaf', predefinida: true },
  { nombre: 'Hogar', color: '#a16207', icono: 'Home', predefinida: true },
  { nombre: 'Personal', color: '#64748b', icono: 'User', predefinida: true },
]
