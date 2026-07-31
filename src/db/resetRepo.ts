import { db } from './db'
import { CATEGORIAS_PREDEFINIDAS } from './defaultCategories'
import { CONFIGURACION_POR_DEFECTO } from './settingsRepo'
import { registrarEliminacion } from './tombstones'

/** Borra hábitos, registros, categorías y configuración, y vuelve a sembrar las categorías y la configuración por defecto. Irreversible. */
export async function eliminarTodosLosDatos(): Promise<void> {
  await db.transaction('rw', db.habitos, db.registros, db.categorias, db.configuracion, db.eliminaciones, async () => {
    const [habitos, registros, categorias] = await Promise.all([
      db.habitos.toArray(),
      db.registros.toArray(),
      db.categorias.toArray(),
    ])

    await db.habitos.clear()
    await db.registros.clear()
    await db.categorias.clear()
    await db.configuracion.clear()
    await db.categorias.bulkAdd(CATEGORIAS_PREDEFINIDAS)
    await db.configuracion.add(CONFIGURACION_POR_DEFECTO)

    for (const h of habitos) await registrarEliminacion(h.uuid, 'habitos')
    for (const r of registros) await registrarEliminacion(r.uuid, 'registros')
    for (const c of categorias) await registrarEliminacion(c.uuid, 'categorias')
  })
}
