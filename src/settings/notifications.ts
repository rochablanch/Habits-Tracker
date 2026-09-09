import type { Habito } from '../db/types'

const CLAVE_NOTIFICADOS = 'habitos-tracker-recordatorios-notificados'

/**
 * Notificaciones del sistema operativo, versión "intermedia" (sin servidor): el aviso lo
 * dispara la app misma, así que llega mientras la app sigue viva —incluso minimizada o con
 * la pantalla apagada— pero no si el usuario la cerró del todo. La versión que avisa siempre
 * necesitaría un servidor push; documentado como mejora futura en CLAUDE.md.
 */
export type EstadoPermiso = 'no-soportado' | 'default' | 'granted' | 'denied'

export function soportaNotificaciones(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function estadoPermiso(): EstadoPermiso {
  if (!soportaNotificaciones()) return 'no-soportado'
  return Notification.permission
}

/** Pide el permiso al navegador. Debe llamarse desde un gesto del usuario (un click). */
export async function pedirPermiso(): Promise<EstadoPermiso> {
  if (!soportaNotificaciones()) return 'no-soportado'
  try {
    return await Notification.requestPermission()
  } catch {
    return estadoPermiso()
  }
}

/**
 * Muestra una notificación. En Android/Chrome el constructor `new Notification()` no está
 * permitido: hay que pedírselo al service worker (el mismo que ya usa la PWA para funcionar
 * offline). Se intenta primero por ahí y se cae al constructor en los navegadores de
 * escritorio donde todavía no hay service worker (por ejemplo en desarrollo).
 */
export async function mostrarNotificacion(titulo: string, cuerpo: string, tag: string): Promise<boolean> {
  if (estadoPermiso() !== 'granted') return false

  const opciones: NotificationOptions = {
    body: cuerpo,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag, // Reemplaza la notificación anterior del mismo hábito en vez de apilar otra.
    lang: 'es-UY',
  }

  try {
    const registro = await navigator.serviceWorker?.getRegistration()
    if (registro?.showNotification) {
      await registro.showNotification(titulo, opciones)
      return true
    }
  } catch {
    // Sigue al plan B.
  }

  try {
    new Notification(titulo, opciones)
    return true
  } catch {
    return false
  }
}

/** Los hábitos de los que todavía no se mandó notificación hoy. */
export function sinNotificarTodavia(pendientes: Habito[], yaNotificados: number[]): Habito[] {
  return pendientes.filter((h) => !yaNotificados.includes(h.id))
}

export function textoNotificacion(habito: Habito): { titulo: string; cuerpo: string } {
  return {
    titulo: habito.nombre,
    cuerpo: habito.horaPreferida
      ? `Es hora de tu hábito de las ${habito.horaPreferida}.`
      : 'Te quedó pendiente este hábito.',
  }
}

/**
 * Igual que los descartes: se guarda en localStorage junto con la fecha, así no se repite la
 * notificación cada vez que se abre la app y al día siguiente vuelve a avisar.
 */
export function leerNotificados(fecha: string): number[] {
  try {
    const crudo = localStorage.getItem(CLAVE_NOTIFICADOS)
    if (!crudo) return []
    const guardado = JSON.parse(crudo) as { fecha?: string; ids?: unknown }
    if (guardado?.fecha !== fecha || !Array.isArray(guardado.ids)) return []
    return guardado.ids.filter((id): id is number => typeof id === 'number')
  } catch {
    return []
  }
}

export function guardarNotificados(fecha: string, ids: number[]): void {
  try {
    localStorage.setItem(CLAVE_NOTIFICADOS, JSON.stringify({ fecha, ids }))
  } catch {
    // Sin localStorage: se podría repetir una notificación, no es grave.
  }
}
