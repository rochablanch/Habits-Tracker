import Dexie, { type EntityTable } from 'dexie'
import type { Categoria, Configuracion, Habito, RegistroDiario } from './types'
import { CATEGORIAS_PREDEFINIDAS } from './defaultCategories'

export class HabitosDB extends Dexie {
  habitos!: EntityTable<Habito, 'id'>
  registros!: EntityTable<RegistroDiario, 'id'>
  categorias!: EntityTable<Categoria, 'id'>
  configuracion!: EntityTable<Configuracion, 'id'>

  constructor(name = 'habitos-tracker') {
    super(name)
    this.version(1).stores({
      habitos: '++id, categoriaId, estado, eliminado',
      registros: '++id, habitoId, fecha, &[habitoId+fecha]',
      categorias: '++id, nombre',
      configuracion: 'id',
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
