import Dexie, { type EntityTable } from 'dexie'
import type { Categoria, Configuracion, Eliminacion, Habito, RegistroDiario } from './types'
import { CATEGORIAS_PREDEFINIDAS } from './defaultCategories'

export class HabitosDB extends Dexie {
  habitos!: EntityTable<Habito, 'id'>
  registros!: EntityTable<RegistroDiario, 'id'>
  categorias!: EntityTable<Categoria, 'id'>
  configuracion!: EntityTable<Configuracion, 'id'>
  eliminaciones!: EntityTable<Eliminacion, 'id'>

  constructor(name = 'habitos-tracker') {
    super(name)
    this.version(1).stores({
      habitos: '++id, categoriaId, estado, eliminado',
      registros: '++id, habitoId, fecha, &[habitoId+fecha]',
      categorias: '++id, nombre',
      configuracion: 'id',
    })

    // v2: agrega un uuid estable a cada fila (para sincronizar entre dispositivos).
    // A las filas que ya existían de la v1 se les asigna uno nuevo al actualizar.
    this.version(2)
      .stores({
        habitos: '++id, uuid, categoriaId, estado, eliminado',
        registros: '++id, uuid, habitoId, fecha, &[habitoId+fecha]',
        categorias: '++id, uuid, nombre',
        configuracion: 'id',
      })
      .upgrade(async (tx) => {
        await tx
          .table('habitos')
          .toCollection()
          .modify((h) => {
            if (!h.uuid) h.uuid = crypto.randomUUID()
          })
        await tx
          .table('registros')
          .toCollection()
          .modify((r) => {
            if (!r.uuid) r.uuid = crypto.randomUUID()
          })
        await tx
          .table('categorias')
          .toCollection()
          .modify((c) => {
            if (!c.uuid) c.uuid = crypto.randomUUID()
          })
      })

    // v3: tabla local de "para borrar en el servidor" (no existía antes de tener sincronización).
    // No hace falta migrar datos: es una tabla nueva, vacía, para todos los que ya tenían la app.
    this.version(3).stores({
      habitos: '++id, uuid, categoriaId, estado, eliminado',
      registros: '++id, uuid, habitoId, fecha, &[habitoId+fecha]',
      categorias: '++id, uuid, nombre',
      configuracion: 'id',
      eliminaciones: '++id, uuid, tabla',
    })

    this.on('populate', () => {
      this.categorias.bulkAdd(CATEGORIAS_PREDEFINIDAS)
      this.configuracion.add({
        id: 1,
        primerDiaSemana: 1,
        formatoFecha: 'DD/MM/YYYY',
        animaciones: true,
        frasesMotivacionales: true,
        recordatoriosActivos: true,
        onboardingCompletado: false,
      })
    })
  }
}

export const db = new HabitosDB()
