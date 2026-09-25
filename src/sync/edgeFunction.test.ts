// @vitest-environment node
// (esbuild y las clases Request/Response del estándar necesitan Node, no el navegador simulado)
import { transform } from 'esbuild'
import { beforeEach, describe, expect, it, vi } from 'vitest'
// `?raw` = traer el archivo como texto, sin ejecutarlo.
import codigoEdgeFunction from '../../supabase/functions/enviar-recordatorios/index.ts?raw'

/**
 * La Edge Function corre en Supabase, sobre Deno, y no se puede importar como un módulo normal
 * (usa `Deno.serve` y trae sus dependencias desde JSR). Acá se le cambian esas dependencias por
 * dobles de prueba y se la ejecuta con un `Deno` de mentira, para poder mandarle consultas
 * igual que lo hacen el navegador y la tarea programada, y ver qué contesta.
 *
 * Esto existe por un error real: la primera versión no contestaba la consulta previa de permiso
 * (CORS) que hace el navegador, así que el botón "Probar aviso del servidor" fallaba con
 * "Failed to send a request to the Edge Function" sin llegar nunca al servidor.
 */
async function montarFuncion(opciones: { vapidJwk?: string; envioFalla?: string } = {}) {
  const enviados: { endpoint: string; mensaje: string; opciones: Record<string, unknown> }[] = []
  const anotados: Record<string, unknown>[] = []

  const dispositivos = [{ endpoint: 'https://push.example/abc', p256dh: 'p', auth: 'a' }]
  const pendientes = [
    {
      endpoint: 'https://push.example/abc',
      p256dh: 'p',
      auth: 'a',
      user_id: 'u1',
      habito_uuid: 'h-uuid',
      nombre: 'Tomar agua',
      hora_preferida: '08:00',
      fecha_local: '2026-09-25',
    },
  ]

  function tabla(nombre: string) {
    return {
      select: () => ({ eq: () => Promise.resolve({ data: dispositivos }) }),
      upsert: (fila: Record<string, unknown>) => {
        if (nombre === 'push_enviados') anotados.push(fila)
        return Promise.resolve({ error: null })
      },
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }
  }

  const supabaseStub = {
    createClient: () => ({
      from: tabla,
      rpc: () => Promise.resolve({ data: pendientes, error: null }),
      auth: {
        getUser: (token: string) =>
          Promise.resolve(
            token === 'token-bueno'
              ? { data: { user: { id: 'u1' } }, error: null }
              : { data: null, error: { message: 'sesion invalida' } },
          ),
      },
    }),
  }

  const webpushStub = {
    Urgency: { High: 'high', Normal: 'normal' },
    importVapidKeys: vi.fn(async (jwk: unknown) => jwk),
    ApplicationServer: {
      new: vi.fn(async () => ({
        subscribe: (s: { endpoint: string }) => ({
          pushTextMessage: async (mensaje: string, opcionesEnvio: Record<string, unknown>) => {
            if (opciones.envioFalla) throw new Error(opciones.envioFalla)
            enviados.push({ endpoint: s.endpoint, mensaje, opciones: opcionesEnvio })
          },
        }),
      })),
    },
  }

  // Se reemplazan los imports de JSR (que solo existen en Deno) por los dobles de prueba.
  const sinImports = codigoEdgeFunction
    .replace(/^import \{ createClient \}.*$/m, 'const { createClient } = __supabase')
    .replace(/^import \* as webpush.*$/m, 'const webpush = __webpush')
  const { code } = await transform(sinImports, { loader: 'ts', format: 'cjs' })

  let handler: ((req: Request) => Promise<Response>) | null = null
  const env: Record<string, string> = {
    SUPABASE_URL: 'https://proyecto.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    CRON_SECRET: 'secreto-del-cron',
    VAPID_EMAIL: 'alguien@example.com',
    VAPID_JWK: opciones.vapidJwk ?? '{"publicKey":{},"privateKey":{}}',
  }
  const Deno = {
    env: { get: (clave: string) => env[clave] },
    serve: (fn: (req: Request) => Promise<Response>) => {
      handler = fn
    },
  }

  new Function('Deno', '__supabase', '__webpush', 'exports', 'module', code)(
    Deno,
    supabaseStub,
    webpushStub,
    {},
    { exports: {} },
  )

  if (!handler) throw new Error('la función nunca llamó a Deno.serve')
  return { llamar: handler as (req: Request) => Promise<Response>, enviados, anotados }
}

const URL_FUNCION = 'https://proyecto.supabase.co/functions/v1/enviar-recordatorios'

function pedido(init: RequestInit) {
  return new Request(URL_FUNCION, init)
}

describe('Edge Function enviar-recordatorios', () => {
  let fn: Awaited<ReturnType<typeof montarFuncion>>

  beforeEach(async () => {
    fn = await montarFuncion()
  })

  it('contesta la consulta de permiso del navegador (CORS)', async () => {
    const r = await fn.llamar(pedido({ method: 'OPTIONS' }))
    expect(r.status).toBe(200)
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(r.headers.get('Access-Control-Allow-Headers')).toContain('authorization')
  })

  it('todas las respuestas llevan los permisos del navegador', async () => {
    const sinPermiso = await fn.llamar(pedido({ method: 'POST', body: '{}' }))
    expect(sinPermiso.status).toBe(401)
    expect(sinPermiso.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('manda los recordatorios que le pasa la base y los anota', async () => {
    const r = await fn.llamar(
      pedido({ method: 'POST', headers: { 'x-cron-secret': 'secreto-del-cron' }, body: '{}' }),
    )

    expect(await r.json()).toMatchObject({ pendientes: 1, enviados: 1, fallas: [] })
    expect(JSON.parse(fn.enviados[0].mensaje)).toEqual({
      titulo: 'Tomar agua',
      cuerpo: 'Es hora de tu hábito de las 08:00.',
      tag: 'habito-h-uuid',
    })
    expect(fn.anotados[0]).toMatchObject({
      user_id: 'u1',
      habito_uuid: 'h-uuid',
      fecha_local: '2026-09-25',
    })
  })

  it('no manda nada si el secreto de la tarea programada no coincide', async () => {
    const r = await fn.llamar(
      pedido({ method: 'POST', headers: { 'x-cron-secret': 'otro' }, body: '{}' }),
    )
    expect(r.status).toBe(401)
    expect(fn.enviados).toHaveLength(0)
  })

  it('pide entrega inmediata, para que el teléfono no guarde el aviso para después', async () => {
    await fn.llamar(
      pedido({ method: 'POST', headers: { 'x-cron-secret': 'secreto-del-cron' }, body: '{}' }),
    )
    expect(fn.enviados[0].opciones).toMatchObject({ urgency: 'high', ttl: 4 * 60 * 60 })
  })

  it('el aviso de prueba caduca enseguida, no sirve si llega horas después', async () => {
    await fn.llamar(
      pedido({
        method: 'POST',
        headers: { Authorization: 'Bearer token-bueno' },
        body: JSON.stringify({ prueba: true }),
      }),
    )
    expect(fn.enviados[0].opciones).toMatchObject({ urgency: 'high', ttl: 300 })
  })

  it('acepta el secreto aunque venga con espacios pegados', async () => {
    // Pasa de verdad: al copiar una clave en un panel web se arrastra un espacio o un salto
    // de línea, y el síntoma sería que no llega ningún recordatorio, sin ningún error visible.
    const r = await fn.llamar(
      pedido({ method: 'POST', headers: { 'x-cron-secret': ' secreto-del-cron ' }, body: '{}' }),
    )
    expect(r.status).toBe(200)
    expect(fn.enviados).toHaveLength(1)
  })

  it('cuando rechaza la llamada, explica por qué', async () => {
    const sinEncabezado = await fn.llamar(pedido({ method: 'POST', body: '{}' }))
    expect((await sinEncabezado.json()).detalle).toContain('no trajo el encabezado')

    const distinto = await fn.llamar(
      pedido({ method: 'POST', headers: { 'x-cron-secret': 'otra-cosa' }, body: '{}' }),
    )
    expect((await distinto.json()).detalle).toContain('no coincide')
  })

  it('el botón de prueba manda un aviso a los dispositivos de esa persona', async () => {
    const r = await fn.llamar(
      pedido({
        method: 'POST',
        headers: { Authorization: 'Bearer token-bueno' },
        body: JSON.stringify({ prueba: true }),
      }),
    )

    expect(await r.json()).toMatchObject({ dispositivos: 1, fallas: [] })
    expect(JSON.parse(fn.enviados[0].mensaje).tag).toBe('prueba')
  })

  it('rechaza el modo prueba con una sesión inválida', async () => {
    const r = await fn.llamar(
      pedido({
        method: 'POST',
        headers: { Authorization: 'Bearer token-vencido' },
        body: JSON.stringify({ prueba: true }),
      }),
    )
    expect(r.status).toBe(401)
    expect(fn.enviados).toHaveLength(0)
  })

  it('no da por enviado un aviso que falló', async () => {
    const conError = await montarFuncion({ envioFalla: 'el servicio rechazó el envío' })
    const r = await conError.llamar(
      pedido({ method: 'POST', headers: { 'x-cron-secret': 'secreto-del-cron' }, body: '{}' }),
    )

    const cuerpo = await r.json()
    expect(cuerpo.enviados).toBe(0)
    expect(cuerpo.fallas[0]).toContain('el servicio rechazó el envío')
    expect(conError.anotados).toHaveLength(0)
  })

  it('avisa con un mensaje claro si la clave VAPID está mal pegada', async () => {
    const rota = await montarFuncion({ vapidJwk: 'esto no es json' })
    const r = await rota.llamar(
      pedido({ method: 'POST', headers: { 'x-cron-secret': 'secreto-del-cron' }, body: '{}' }),
    )

    const cuerpo = await r.json()
    expect(cuerpo.fallas[0]).toContain('VAPID_JWK no es un JSON válido')
  })
})
