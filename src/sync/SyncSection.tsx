import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthContext'

export function SyncSection() {
  const { session, cargando, enviarLinkMagico, cerrarSesion } = useAuth()
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
      setError('No se pudo enviar el link. Revisá el correo e intentá de nuevo.')
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
        <button
          type="button"
          onClick={() => void cerrarSesion()}
          className="mt-3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cerrar sesión
        </button>
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
