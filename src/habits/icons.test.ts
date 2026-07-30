import { describe, expect, it } from 'vitest'
import { buscarIconos, ICONOS_HABITO, obtenerIcono } from './icons'

describe('buscarIconos', () => {
  it('sin texto de búsqueda devuelve el catálogo completo', () => {
    expect(buscarIconos('')).toHaveLength(ICONOS_HABITO.length)
    expect(buscarIconos('   ')).toHaveLength(ICONOS_HABITO.length)
  })

  it('encuentra íconos por palabra clave en español', () => {
    const resultado = buscarIconos('agua')
    const nombres = resultado.map((i) => i.nombre)
    expect(nombres).toContain('Droplet')
    expect(nombres).toContain('GlassWater')
  })

  it('no distingue mayúsculas ni acentos', () => {
    const conAcento = buscarIconos('mañana').map((i) => i.nombre)
    const sinAcento = buscarIconos('MANANA').map((i) => i.nombre)
    expect(conAcento).toEqual(sinAcento)
    expect(conAcento).toContain('Sunrise')
  })

  it('también busca por el nombre del ícono', () => {
    expect(buscarIconos('Dumbbell').map((i) => i.nombre)).toContain('Dumbbell')
  })

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(buscarIconos('xyzxyzxyz')).toEqual([])
  })
})

describe('obtenerIcono', () => {
  it('devuelve el componente correcto para un nombre válido', () => {
    expect(obtenerIcono('Dumbbell')).toBeDefined()
  })

  it('devuelve un ícono por defecto para un nombre desconocido', () => {
    expect(obtenerIcono('NoExiste')).toBeDefined()
  })
})
