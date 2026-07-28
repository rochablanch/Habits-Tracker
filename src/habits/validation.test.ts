import { describe, expect, it } from 'vitest'
import type { DatosFormularioHabito } from './formTypes'
import { formularioAHabito, validarHabito } from './validation'

function formularioValido(cambios: Partial<DatosFormularioHabito> = {}): DatosFormularioHabito {
  return {
    nombre: 'Meditar',
    descripcion: '',
    icono: 'Sparkles',
    color: '#6366f1',
    categoriaId: null,
    fechaInicio: '2026-07-28',
    tipo: 'si_no',
    frecuencia: 'diaria',
    diasSemana: [],
    vecesPorSemana: '',
    vecesPorDia: '1',
    unidadMedida: '',
    metaCantidad: '',
    horaPreferida: '',
    recordatorio: false,
    prioridad: 'media',
    notas: '',
    ...cambios,
  }
}

describe('validarHabito', () => {
  it('no reporta errores para un hábito sí/no completo', () => {
    expect(validarHabito(formularioValido())).toEqual({})
  })

  it('exige nombre', () => {
    const errores = validarHabito(formularioValido({ nombre: '  ' }))
    expect(errores.nombre).toBeDefined()
  })

  it('exige al menos un día si la frecuencia es días específicos', () => {
    const errores = validarHabito(formularioValido({ frecuencia: 'dias_semana', diasSemana: [] }))
    expect(errores.diasSemana).toBeDefined()
  })

  it('acepta días específicos cuando hay al menos uno elegido', () => {
    const errores = validarHabito(formularioValido({ frecuencia: 'dias_semana', diasSemana: [1, 3, 5] }))
    expect(errores.diasSemana).toBeUndefined()
  })

  it('exige un número de 1 a 7 si la frecuencia es "x veces por semana"', () => {
    expect(
      validarHabito(formularioValido({ frecuencia: 'x_veces_semana', vecesPorSemana: '0' })).vecesPorSemana,
    ).toBeDefined()
    expect(
      validarHabito(formularioValido({ frecuencia: 'x_veces_semana', vecesPorSemana: '8' })).vecesPorSemana,
    ).toBeDefined()
    expect(
      validarHabito(formularioValido({ frecuencia: 'x_veces_semana', vecesPorSemana: '5' })).vecesPorSemana,
    ).toBeUndefined()
  })

  it('exige meta mayor a 0 para hábitos de tipo cantidad, tiempo o límite máximo', () => {
    expect(validarHabito(formularioValido({ tipo: 'cantidad', metaCantidad: '' })).metaCantidad).toBeDefined()
    expect(validarHabito(formularioValido({ tipo: 'cantidad', metaCantidad: '0' })).metaCantidad).toBeDefined()
    expect(validarHabito(formularioValido({ tipo: 'cantidad', metaCantidad: '8' })).metaCantidad).toBeUndefined()
  })

  it('no exige meta para hábitos sí/no o evitar', () => {
    expect(validarHabito(formularioValido({ tipo: 'si_no' })).metaCantidad).toBeUndefined()
    expect(validarHabito(formularioValido({ tipo: 'evitar' })).metaCantidad).toBeUndefined()
  })

  it('exige hora preferida si el recordatorio está activado', () => {
    const errores = validarHabito(formularioValido({ recordatorio: true, horaPreferida: '' }))
    expect(errores.horaPreferida).toBeDefined()
  })
})

describe('formularioAHabito', () => {
  it('convierte campos numéricos de texto a número', () => {
    const habito = formularioAHabito(formularioValido({ tipo: 'cantidad', metaCantidad: '8', unidadMedida: 'vasos' }))
    expect(habito.metaCantidad).toBe(8)
    expect(habito.unidadMedida).toBe('vasos')
  })

  it('limpia diasSemana y vecesPorSemana si la frecuencia no los usa', () => {
    const habito = formularioAHabito(
      formularioValido({ frecuencia: 'diaria', diasSemana: [1, 2], vecesPorSemana: '3' }),
    )
    expect(habito.diasSemana).toEqual([])
    expect(habito.vecesPorSemana).toBeUndefined()
  })

  it('recorta espacios en blanco del nombre y convierte campos opcionales vacíos a undefined', () => {
    const habito = formularioAHabito(formularioValido({ nombre: '  Meditar  ', descripcion: '   ' }))
    expect(habito.nombre).toBe('Meditar')
    expect(habito.descripcion).toBeUndefined()
  })
})
