import { afterEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { actualizarConfiguracion, obtenerConfiguracion } from '../settingsRepo'

afterEach(async () => {
  await db.configuracion.clear()
})

describe('settingsRepo', () => {
  it('devuelve valores por defecto (Uruguay: semana empieza el lunes) si nunca se guardó nada', async () => {
    const config = await obtenerConfiguracion()
    expect(config.primerDiaSemana).toBe(1)
    expect(config.formatoFecha).toBe('DD/MM/YYYY')
  })

  it('actualiza solo los campos indicados, conservando el resto', async () => {
    await actualizarConfiguracion({ animaciones: false })
    const config = await obtenerConfiguracion()

    expect(config.animaciones).toBe(false)
    expect(config.frasesMotivacionales).toBe(true)
  })

  it('completa con valores por defecto los campos que falten en una configuración guardada antigua', async () => {
    // simula una fila guardada antes de que existiera el campo "onboardingCompletado"
    await db.configuracion.add({
      id: 1,
      primerDiaSemana: 0,
      formatoFecha: 'DD/MM/YYYY',
      animaciones: true,
      frasesMotivacionales: true,
      recordatoriosActivos: true,
    } as never)

    const config = await obtenerConfiguracion()
    expect(config.onboardingCompletado).toBe(false)
    expect(config.primerDiaSemana).toBe(0) // conserva lo que sí estaba guardado
  })
})
