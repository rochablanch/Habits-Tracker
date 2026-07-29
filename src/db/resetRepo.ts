import { db } from './db'
import { CATEGORIAS_PREDEFINIDAS } from './defaultCategories'
import { CONFIGURACION_POR_DEFECTO } from './settingsRepo'

/** Borra hábitos, registros, categorías y configuración, y vuelve a sembrar las categorías y la configuración por defecto. Irreversible. */
export async function eliminarTodosLosDatos(): Promise<void> {
  await db.transaction('rw', db.habitos, db.registros, db.categorias, db.configuracion, async () => {
    await db.habitos.clear()
    await db.registros.clear()
    await db.categorias.clear()
    await db.configuracion.clear()
    await db.categorias.bulkAdd(CATEGORIAS_PREDEFINIDAS)
    await db.configuracion.add(CONFIGURACION_POR_DEFECTO)
  })
}
