import type { Categoria } from './types'

/**
 * Categorías sugeridas al iniciar. El usuario puede editarlas o eliminarlas libremente.
 * Los uuid son fijos (no aleatorios) a propósito: si dos dispositivos siembran estas
 * categorías por separado antes de sincronizar por primera vez, deben reconocerse como
 * la misma categoría en vez de duplicarse al sincronizar.
 */
export const CATEGORIAS_PREDEFINIDAS: Omit<Categoria, 'id'>[] = [
  { uuid: '00000000-0000-4000-8000-000000000001', nombre: 'Salud', color: '#ef4444', icono: 'HeartPulse', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000002', nombre: 'Ejercicio', color: '#f97316', icono: 'Dumbbell', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000003', nombre: 'Alimentación', color: '#84cc16', icono: 'Apple', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000004', nombre: 'Productividad', color: '#0ea5e9', icono: 'ListChecks', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000005', nombre: 'Trabajo', color: '#6366f1', icono: 'Briefcase', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000006', nombre: 'Finanzas', color: '#14b8a6', icono: 'Wallet', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000007', nombre: 'Trading', color: '#059669', icono: 'TrendingUp', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000008', nombre: 'Estudio', color: '#8b5cf6', icono: 'BookOpen', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000009', nombre: 'Bienestar', color: '#ec4899', icono: 'Leaf', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000010', nombre: 'Hogar', color: '#a16207', icono: 'Home', predefinida: true },
  { uuid: '00000000-0000-4000-8000-000000000011', nombre: 'Personal', color: '#64748b', icono: 'User', predefinida: true },
]
