/*
 * Se suma al service worker que genera vite-plugin-pwa (ver `workbox.importScripts` en
 * vite.config.ts). Solo se ocupa de qué pasa al tocar una notificación de recordatorio:
 * traer al frente la app si ya está abierta, o abrirla si no lo está.
 */
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
