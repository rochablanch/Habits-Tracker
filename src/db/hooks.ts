import { useLiveQuery } from 'dexie-react-hooks'
import { listarCategorias } from './categoriesRepo'
import { listarHabitos, obtenerHabito, type FiltroHabitos } from './habitsRepo'
import { listarRegistrosEnRango, listarRegistrosPorHabito } from './logsRepo'
import { obtenerConfiguracion } from './settingsRepo'

export function useCategorias() {
  return useLiveQuery(() => listarCategorias(), [])
}

export function useHabitos(filtro: FiltroHabitos) {
  return useLiveQuery(
    () => listarHabitos(filtro),
    [filtro.estado, filtro.categoriaId, filtro.incluirEliminados],
  )
}

/** undefined = cargando, null = no existe, Habito = encontrado. */
export function useHabito(id: number | undefined) {
  return useLiveQuery(async () => {
    if (id === undefined || Number.isNaN(id)) return null
    const habito = await obtenerHabito(id)
    return habito ?? null
  }, [id])
}

export function useHistorialHabito(habitoId: number | undefined) {
  return useLiveQuery(() => (habitoId ? listarRegistrosPorHabito(habitoId) : []), [habitoId])
}

export function useRegistrosEnRango(desde: string, hasta: string) {
  return useLiveQuery(() => listarRegistrosEnRango(desde, hasta), [desde, hasta])
}

export function useConfiguracion() {
  return useLiveQuery(() => obtenerConfiguracion(), [])
}
