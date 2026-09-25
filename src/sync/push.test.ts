import { describe, expect, it } from 'vitest'
import { base64UrlABytes, bytesABase64Url, CLAVE_PUBLICA_VAPID } from './push'

describe('conversión de claves para Web Push', () => {
  it('la clave pública VAPID tiene el largo que espera el navegador', () => {
    // 65 bytes: un 0x04 inicial + las dos coordenadas de 32 bytes de la curva P-256.
    const bytes = base64UrlABytes(CLAVE_PUBLICA_VAPID)
    expect(bytes.length).toBe(65)
    expect(bytes[0]).toBe(4)
  })

  it('convierte de ida y vuelta sin perder nada', () => {
    const original = CLAVE_PUBLICA_VAPID
    const bytes = base64UrlABytes(original)
    expect(bytesABase64Url(bytes.buffer as ArrayBuffer)).toBe(original)
  })

  it('usa el alfabeto base64url (sin +, / ni =)', () => {
    const bytes = new Uint8Array([251, 255, 190, 0])
    const texto = bytesABase64Url(bytes.buffer)
    expect(texto).not.toMatch(/[+/=]/)
    expect(base64UrlABytes(texto)).toEqual(bytes)
  })

  it('devuelve texto vacío si no hay clave', () => {
    expect(bytesABase64Url(null)).toBe('')
  })
})
