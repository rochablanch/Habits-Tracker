import { supabase } from './supabaseClient'

/**
 * Notificaciones que llegan con la app cerrada ("Web Push").
 *
 * A diferencia de las notificaciones locales (`settings/notifications.ts`), que las dispara
 * la app y por eso solo funcionan mientras el navegador la mantiene viva, estas las manda el
 * servidor: el navegador las recibe y las muestra aunque la app esté cerrada y el teléfono
 * bloqueado. Requiere tener la sesión iniciada (Configuración → Sincronización), porque el
 * servidor necesita saber qué hábitos son de quién.
 *
 * Esta clave pública identifica al servidor que tiene permitido mandarnos notificaciones
 * (estándar VAPID). Es pública a propósito; la privada vive solo en Supabase.
 */
export const CLAVE_PUBLICA_VAPID =
  'BDCprFx6TNH808nbTFga80uOcGHTQwPNjVx6f6HJcHnbU1BqJAJCgvdW-pfZzDF-0d4A-XUJM8wzxAteYHk9uOs'

/** Recordatorio local de que este dispositivo está suscrito, para no duplicar el aviso. */
const CLAVE_PUSH_ACTIVO = 'habitos-tracker-push-activo'

export function soportaPush(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

/** ¿Este dispositivo ya está anotado en el servidor? (lectura sincrónica, para no duplicar avisos) */
export function pushActivoLocalmente(): boolean {
  try {
    return localStorage.getItem(CLAVE_PUSH_ACTIVO) === 'si'
  } catch {
    return false
  }
}

function marcarPushActivo(activo: boolean): void {
  try {
    if (activo) localStorage.setItem(CLAVE_PUSH_ACTIVO, 'si')
    else localStorage.removeItem(CLAVE_PUSH_ACTIVO)
  } catch {
    // Sin localStorage: en el peor caso llega el aviso del servidor y el de la app; el
    // `tag` compartido hace que el teléfono muestre uno solo igual.
  }
}

/** Exportadas para poder probar la conversión de claves, que si falla rompe el cifrado. */
export function base64UrlABytes(base64: string): Uint8Array {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const normal = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/')
  const crudo = atob(normal)
  return Uint8Array.from([...crudo].map((c) => c.charCodeAt(0)))
}

export function bytesABase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binario = ''
  bytes.forEach((b) => {
    binario += String.fromCharCode(b)
  })
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function suscripcionDelNavegador(): Promise<PushSubscription | null> {
  if (!soportaPush()) return null
  const registro = await navigator.serviceWorker.getRegistration()
  return (await registro?.pushManager.getSubscription()) ?? null
}

/**
 * Anota este dispositivo en el servidor. Devuelve el mensaje de error real si algo falla
 * (mismo criterio que el inicio de sesión: un error genérico sería imposible de diagnosticar
 * a distancia).
 */
export async function activarPush(userId: string): Promise<{ error: string | null }> {
  if (!soportaPush()) return { error: 'Este navegador no permite notificaciones con la app cerrada.' }

  try {
    const registro = await navigator.serviceWorker.ready
    const existente = await registro.pushManager.getSubscription()
    const suscripcion =
      existente ??
      (await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlABytes(CLAVE_PUBLICA_VAPID) as BufferSource,
      }))

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: suscripcion.endpoint,
        p256dh: bytesABase64Url(suscripcion.getKey('p256dh')),
        auth: bytesABase64Url(suscripcion.getKey('auth')),
        // El servidor necesita la zona horaria para saber qué hora es acá cuando decide avisar.
        zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Montevideo',
      },
      { onConflict: 'endpoint' },
    )
    if (error) return { error: error.message }

    marcarPushActivo(true)
    return { error: null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

/** Borra este dispositivo del servidor y cancela la suscripción del navegador. */
export async function desactivarPush(): Promise<{ error: string | null }> {
  marcarPushActivo(false)
  try {
    const suscripcion = await suscripcionDelNavegador()
    if (!suscripcion) return { error: null }

    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', suscripcion.endpoint)
    await suscripcion.unsubscribe()
    return { error: error?.message ?? null }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Le pide al servidor que mande un aviso de prueba a este dispositivo, sin esperar a la hora
 * de ningún hábito. Es la forma de comprobar toda la cadena (servidor → navegador →
 * notificación), incluso con la app cerrada.
 */
export async function probarPushDelServidor(): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('enviar-recordatorios', {
    body: { prueba: true },
  })

  if (error) {
    // Si el servidor contestó algo (aunque sea un error), su mensaje explica mucho mejor qué
    // pasó que el genérico del cliente. Si no contestó nada, es que no se lo pudo alcanzar.
    const respuesta = (error as { context?: Response }).context
    const detalle = await respuesta?.json?.().catch(() => null)
    if (detalle?.error) return { error: detalle.error }
    if (!respuesta) {
      return {
        error:
          'no se pudo contactar al servidor (revisá que la función enviar-recordatorios esté publicada y con "Verify JWT" desactivado)',
      }
    }
    return { error: error.message }
  }

  const fallas = (data as { fallas?: string[] })?.fallas ?? []
  return { error: fallas.length > 0 ? fallas[0] : null }
}
