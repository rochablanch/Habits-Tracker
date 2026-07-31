import { AlertCircle, RefreshCw } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'
import { useSync } from './SyncContext'

function formatearUltimaSync(fecha: Date | null): string {
  if (!fecha) return 'Todavía no sincronizó en este dispositivo.'
  const segundos = Math.round((Date.now() - fecha.getTime()) / 1000)
  if (segundos < 10) return 'Sincronizado recién.'
  if (segundos < 60) return `Sincronizado hace ${segundos} segundos.`
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `Sincronizado hace ${minutos} minuto${minutos === 1 ? '' : 's'}.`
  const horas = Math.round(minutos / 60)
  return `Sincronizado hace ${horas} hora${horas === 1 ? '' : 's'}.`
}

export function SyncSection() {
  const { session, cargando, enviarLinkMagico, cerrarSesion } = useAuth()
  const { sincronizando, ultimaSincronizacion, error: errorSync, sincronizarAhora } = useSync()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault()
    setError(null)
    setMensaje(null)
    setEnviando(true)
    const correo = email.trim()
    const { error: errorEnvio } = await enviarLinkMagico(correo)
    setEnviando(false)
    if (errorEnvio) {
      setError(`No se pudo enviar el link: ${errorEnvio}`)
    } else {
      setMensaje(`Te enviamos un link a ${correo}. Abrilo desde este dispositivo para iniciar sesión.`)
    }
  }

  if (cargando) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
  }

  if (session) {
    return (
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sesión iniciada como{' '}
          <strong className="text-slate-800 dark:text-slate-200">{session.user.email}</strong>.
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {sincronizando ? 'Sincronizando…' : formatearUltimaSync(ultimaSincronizacion)}
        </p>

        {errorSync && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {errorSync}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void sincronizarAhora()}
            disabled={sincronizando}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} aria-hidden="true" />
            Sincronizar ahora
          </button>
          <button
            type="button"
            onClick={() => void cerrarSesion()}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Iniciá sesión con tu correo para sincronizar tus hábitos entre dispositivos. No usa contraseña: te
        mandamos un link, lo abrís, y listo.
      </p>
      <form onSubmit={manejarEnvio} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          aria-label="Correo electrónico"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? 'Enviando…' : 'Enviar link'}
        </button>
      </form>

      {mensaje && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{mensaje}</p>}
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
