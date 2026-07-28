import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  listarRegistrosPorFecha,
  listarRegistrosPorHabito,
  obtenerRegistro,
  quitarRegistro,
  registrarCumplimiento,
} from '../logsRepo'

const HABITO_ID = 1
const OTRO_HABITO_ID = 2

afterEach(async () => {
  await db.registros.clear()
})

describe('logsRepo', () => {
  it('registra un cumplimiento nuevo', async () => {
    await registrarCumplimiento(HABITO_ID, '2026-07-28', { estado: 'completado' })
    const registro = await obtenerRegistro(HABITO_ID, '2026-07-28')
    expect(registro?.estado).toBe('completado')
  })

  it('nunca duplica: registrar dos veces el mismo día actualiza el registro existente', async () => {
    await registrarCumplimiento(HABITO_ID, '2026-07-28', { estado: 'completado' })
    await registrarCumplimiento(HABITO_ID, '2026-07-28', { estado: 'omitido', motivoOmision: 'Viaje' })

    const registros = await db.registros.where('habitoId').equals(HABITO_ID).toArray()
    expect(registros).toHaveLength(1)
    expect(registros[0].estado).toBe('omitido')
    expect(registros[0].motivoOmision).toBe('Viaje')
  })

  it('registra cantidades para hábitos de tipo cantidad/tiempo', async () => {
    await registrarCumplimiento(HABITO_ID, '2026-07-28', { estado: 'completado', valor: 30 })
    const registro = await obtenerRegistro(HABITO_ID, '2026-07-28')
    expect(registro?.valor).toBe(30)
  })

  it('desmarcar quita el registro por completo (vuelve a pendiente)', async () => {
    await registrarCumplimiento(HABITO_ID, '2026-07-28', { estado: 'completado' })
    await quitarRegistro(HABITO_ID, '2026-07-28')
    expect(await obtenerRegistro(HABITO_ID, '2026-07-28')).toBeUndefined()
  })

  it('permite consultar todos los registros de una fecha, sin mezclar hábitos', async () => {
    await registrarCumplimiento(HABITO_ID, '2026-07-28', { estado: 'completado' })
    await registrarCumplimiento(OTRO_HABITO_ID, '2026-07-28', { estado: 'omitido' })
    await registrarCumplimiento(HABITO_ID, '2026-07-27', { estado: 'completado' })

    const delDia = await listarRegistrosPorFecha('2026-07-28')
    expect(delDia).toHaveLength(2)
  })

  it('permite consultar el historial de un hábito filtrando por rango de fechas', async () => {
    await registrarCumplimiento(HABITO_ID, '2026-07-01', { estado: 'completado' })
    await registrarCumplimiento(HABITO_ID, '2026-07-15', { estado: 'completado' })
    await registrarCumplimiento(HABITO_ID, '2026-07-28', { estado: 'completado' })

    const enRango = await listarRegistrosPorHabito(HABITO_ID, { desde: '2026-07-10', hasta: '2026-07-20' })
    expect(enRango.map((r) => r.fecha)).toEqual(['2026-07-15'])
  })
})
