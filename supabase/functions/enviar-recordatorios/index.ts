/*
 * Edge Function "enviar-recordatorios" (Supabase).
 *
 * La llama una tarea programada (pg_cron) una vez por minuto. En cada corrida:
 *   1. Le pregunta a la base qué recordatorios tocan en este minuto (función SQL
 *      `recordatorios_a_enviar`, que ya considera la zona horaria de cada dispositivo).
 *   2. Manda la notificación a cada dispositivo (Web Push, firmada con las claves VAPID).
 *   3. Anota lo enviado en `push_enviados` para no repetirlo hoy.
 *
 * Esto es lo que hace que el aviso llegue con la app cerrada: el servidor no depende de que
 * el teléfono tenga la app abierta.
 *
 * Secretos que necesita (Supabase → Edge Functions → Secrets):
 *   VAPID_JWK    el par de claves en JSON: { "publicKey": {...}, "privateKey": {...} }
 *   VAPID_EMAIL  un correo de contacto, requisito del estándar (ej. mailto para el servicio push)
 *   CRON_SECRET  clave compartida con la tarea programada, para que nadie más pueda invocarla
 * SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las pone Supabase sola.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush@^0.5.0'

interface Recordatorio {
  endpoint: string
  p256dh: string
  auth: string
  user_id: string
  habito_uuid: string
  nombre: string
  hora_preferida: string
  fecha_local: string
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

/**
 * El servidor de aplicación (el que firma los avisos con las claves VAPID) se arma la primera
 * vez que hace falta, no al arrancar: si el secreto VAPID_JWK estuviera mal pegado, así se
 * devuelve un mensaje que se entiende en vez de que la función entera no levante.
 */
let appServerCache: Awaited<ReturnType<typeof webpush.ApplicationServer.new>> | null = null

async function obtenerAppServer() {
  if (appServerCache) return appServerCache
  const crudo = Deno.env.get('VAPID_JWK')
  if (!crudo) throw new Error('falta el secreto VAPID_JWK')

  let jwk: unknown
  try {
    jwk = JSON.parse(crudo)
  } catch {
    throw new Error('el secreto VAPID_JWK no es un JSON válido')
  }

  const vapidKeys = await webpush.importVapidKeys(jwk as never, { extractable: false })
  appServerCache = await webpush.ApplicationServer.new({
    contactInformation: `mailto:${Deno.env.get('VAPID_EMAIL') ?? 'nadie@example.com'}`,
    vapidKeys,
  })
  return appServerCache
}

/**
 * Permisos para que el navegador deje llamar a esta función desde la app (CORS). La llamada del
 * botón "Probar aviso del servidor" viaja con encabezados propios, así que el navegador manda
 * antes una consulta OPTIONS preguntando si tiene permiso; si no se le contesta con estas
 * cabeceras, corta la llamada y la app solo ve "Failed to send a request to the Edge Function".
 * La tarea programada (servidor a servidor) no pasa por esto.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

/** 404/410 = el navegador ya no existe o desinstalaron la app: la suscripción quedó muerta. */
function suscripcionMuerta(error: unknown): boolean {
  const estado = (error as { response?: { status?: number } })?.response?.status
  return estado === 404 || estado === 410
}

/** Manda un aviso suelto a un dispositivo. Devuelve null si salió bien, o el error. */
async function enviar(
  destino: { endpoint: string; p256dh: string; auth: string },
  mensaje: string,
): Promise<string | null> {
  try {
    const appServer = await obtenerAppServer()
    const suscriptor = appServer.subscribe({
      endpoint: destino.endpoint,
      keys: { p256dh: destino.p256dh, auth: destino.auth },
    })
    await suscriptor.pushTextMessage(mensaje, {})
    return null
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e)
    if (suscripcionMuerta(e)) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', destino.endpoint)
    } else {
      await supabase
        .from('push_subscriptions')
        .update({ ultimo_error: detalle.slice(0, 500) })
        .eq('endpoint', destino.endpoint)
    }
    return detalle
  }
}

/**
 * Modo prueba: lo llama la app desde el botón "Probar aviso del servidor" en Configuración,
 * con la sesión de la persona. Manda un aviso de prueba a sus propios dispositivos, sin
 * esperar a la hora de ningún hábito. Sirve para verificar de punta a punta (incluso con la
 * app cerrada) que la cadena servidor → navegador → notificación funciona.
 */
async function modoPrueba(token: string): Promise<Response> {
  const { data: usuario, error } = await supabase.auth.getUser(token)
  if (error || !usuario?.user) return responder({ error: 'sesión inválida' }, 401)

  const { data: dispositivos } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', usuario.user.id)

  if (!dispositivos?.length) {
    return responder({ error: 'este dispositivo todavía no está anotado para recibir avisos' }, 404)
  }

  const mensaje = JSON.stringify({
    titulo: 'Hábitos',
    cuerpo: 'Prueba: así te van a llegar los recordatorios, incluso con la app cerrada.',
    tag: 'prueba',
  })
  const fallas: string[] = []
  for (const d of dispositivos) {
    const falla = await enviar(d, mensaje)
    if (falla) fallas.push(falla)
  }

  return responder({ dispositivos: dispositivos.length, fallas })
}

Deno.serve(async (req) => {
  // Consulta previa del navegador ("¿me dejás llamarte?"): se contesta y listo.
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const cuerpo = await req.json().catch(() => ({}))
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (cuerpo?.prueba === true && token) {
    return await modoPrueba(token)
  }

  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return responder({ error: 'no autorizado' }, 401)
  }

  const { data, error } = await supabase.rpc('recordatorios_a_enviar')
  if (error) return responder({ error: error.message }, 500)

  const pendientes = (data ?? []) as Recordatorio[]
  let enviados = 0
  const fallas: string[] = []

  for (const r of pendientes) {
    const mensaje = JSON.stringify({
      titulo: r.nombre,
      cuerpo: `Es hora de tu hábito de las ${r.hora_preferida}.`,
      // Mismo `tag` que usa el aviso local de la app: nunca se apilan dos del mismo hábito.
      tag: `habito-${r.habito_uuid}`,
    })

    const falla = await enviar(r, mensaje)
    if (falla) {
      fallas.push(`${r.nombre}: ${falla}`)
      continue
    }

    // Se anota solo lo que efectivamente salió, igual que hace la app con sus avisos locales.
    await supabase
      .from('push_enviados')
      .upsert(
        { user_id: r.user_id, habito_uuid: r.habito_uuid, fecha_local: r.fecha_local },
        { onConflict: 'user_id,habito_uuid,fecha_local' },
      )
    enviados++
  }

  return responder({ pendientes: pendientes.length, enviados, fallas })
})
