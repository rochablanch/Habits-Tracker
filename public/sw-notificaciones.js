/*
 * Se suma al service worker que genera vite-plugin-pwa (ver `workbox.importScripts` en
 * vite.config.ts). Se ocupa de las notificaciones:
 *
 * - `push`: el aviso que manda el servidor (Supabase) a la hora del recordatorio. Esto es lo
 *   que permite que la notificación llegue con la app cerrada: el service worker se despierta
 *   solo para mostrarla, sin que la app esté corriendo.
 * - `notificationclick`: al tocarla, trae la app al frente o la abre.
 */
self.addEventListener('push', (event) => {
  let datos = {}
  try {
    datos = event.data ? event.data.json() : {}
  } catch {
    datos = { titulo: 'Hábitos', cuerpo: event.data ? event.data.text() : '' }
  }

  // El navegador exige mostrar algo visible cuando llega un push, así que siempre hay título.
  const titulo = datos.titulo || 'Hábitos'
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // Mismo `tag` que usa el aviso local de la app: si por algún motivo llegaran los dos,
      // el teléfono muestra uno solo en vez de apilarlos.
      tag: datos.tag || 'habito',
      lang: 'es-UY',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const abierta = ventanas.find((v) => 'focus' in v)
      if (abierta) {
        await abierta.focus()
        return
      }
      if (self.clients.openWindow) await self.clients.openWindow('/')
    })(),
  )
})
