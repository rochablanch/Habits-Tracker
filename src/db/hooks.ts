import { useLiveQuery } from 'dexie-react-hooks'
import { listarCategorias } from './categoriesRepo'
import { listarHabitos, obtenerHabito, type FiltroHabitos } from './habitsRepo'

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
