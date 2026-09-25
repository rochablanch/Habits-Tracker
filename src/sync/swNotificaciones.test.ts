import { beforeEach, describe, expect, it, vi } from 'vitest'
// `?raw` = traer el archivo como texto, sin ejecutarlo (lo hace Vite).
import codigoServiceWorker from '../../public/sw-notificaciones.js?raw'

/**
 * `public/sw-notificaciones.js` corre dentro del service worker, no en la app, así que no se
 * puede importar como un módulo normal. Acá se lo ejecuta con un `self` de mentira para poder
 * disparar un evento `push` igual al que manda el servidor y ver qué notificación muestra.
 */
type Listener = (evento: unknown) => void

function cargarServiceWorker() {
  const listeners = new Map<string, Listener>()
  const showNotification = vi.fn().mockResolvedValue(undefined)
  const openWindow = vi.fn().mockResolvedValue(undefined)
  const ventanas: { focus: () => void }[] = []

  const self = {
    addEventListener: (nombre: string, fn: Listener) => listeners.set(nombre, fn),
    registration: { showNotification },
    clients: { matchAll: vi.fn().mockResolvedValue(ventanas), openWindow },
  }

  new Function('self', codigoServiceWorker)(self)

  async function disparar(nombre: string, evento: Record<string, unknown>) {
    const esperas: Promise<unknown>[] = []
    const listener = listeners.get(nombre)
    if (!listener) throw new Error(`el service worker no escucha "${nombre}"`)
    listener({ ...evento, waitUntil: (p: Promise<unknown>) => esperas.push(p) })
    await Promise.all(esperas)
  }

  return { disparar, showNotification, openWindow, ventanas, listeners }
}

describe('service worker: aviso que manda el servidor', () => {
  let sw: ReturnType<typeof cargarServiceWorker>

  beforeEach(() => {
    sw = cargarServiceWorker()
  })

  it('muestra la notificación con lo que mandó el servidor', async () => {
    await sw.disparar('push', {
      data: { json: () => ({ titulo: 'Tomar agua', cuerpo: 'Es hora de tu hábito de las 08:00.', tag: 'habito-abc' }) },
    })

    expect(sw.showNotification).toHaveBeenCalledWith(
      'Tomar agua',
      expect.objectContaining({ body: 'Es hora de tu hábito de las 08:00.', tag: 'habito-abc' }),
    )
  })

  it('muestra algo igual si el mensaje no es el esperado', async () => {
    // El navegador exige mostrar una notificación por cada push recibido: quedarse callado
    // hace que deje de entregarlos.
    await sw.disparar('push', {
      data: {
        json: () => {
          throw new Error('no es JSON')
        },
        text: () => 'texto suelto',
      },
    })

    expect(sw.showNotification).toHaveBeenCalledWith('Hábitos', expect.objectContaining({ body: 'texto suelto' }))
  })

  it('muestra algo aunque el push venga sin contenido', async () => {
    await sw.disparar('push', { data: null })
    expect(sw.showNotification).toHaveBeenCalledWith('Hábitos', expect.objectContaining({ body: '' }))
  })

  it('al tocar la notificación, abre la app si no había ninguna ventana', async () => {
    const cerrar = vi.fn()
    await sw.disparar('notificationclick', { notification: { close: cerrar } })
    expect(cerrar).toHaveBeenCalled()
    expect(sw.openWindow).toHaveBeenCalledWith('/')
  })

  it('al tocar la notificación, trae al frente la ventana ya abierta', async () => {
    const focus = vi.fn()
    sw.ventanas.push({ focus })
    await sw.disparar('notificationclick', { notification: { close: vi.fn() } })
    expect(focus).toHaveBeenCalled()
    expect(sw.openWindow).not.toHaveBeenCalled()
  })
})
