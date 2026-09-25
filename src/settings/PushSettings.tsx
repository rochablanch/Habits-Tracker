import { BellRing, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../sync/AuthContext'
import {
  activarPush,
  desactivarPush,
  probarPushDelServidor,
  soportaPush,
  suscripcionDelNavegador,
} from '../sync/push'

/**
 * "Avisarme aunque la app esté cerrada": anota este dispositivo en el servidor para que sea
 * él quien mande la notificación a la hora del recordatorio. Necesita sesión iniciada, porque
 * el servidor tiene que saber de quién son los hábitos (y ya los tiene, por la sincronización).
 */
export function PushSettings() {
  const { session } = useAuth()
  const [suscrito, setSuscrito] = useState<boolean | null>(null)
  const [trabajando, setTrabajando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    suscripcionDelNavegador().then((s) => {
      if (vigente) setSuscrito(Boolean(s))
    })
    return () => {
      vigente = false
    }
  }, [])

  if (!soportaPush()) return null

  if (!session) {
    return (
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Para que el aviso te llegue también con la app cerrada, iniciá sesión en{' '}
        <Link to="/configuracion" className="font-medium text-brand-600 underline">
          Sincronización
        </Link>
        . El aviso lo manda el servidor, así que necesita saber cuáles son tus hábitos.
      </p>
    )
  }

  async function cambiar(activar: boolean) {
    setTrabajando(true)
    setAviso(null)
    const { error } = activar ? await activarPush(session!.user.id) : await desactivarPush()
    setTrabajando(false)
    if (error) {
      setAviso(error)
      return
    }
    setSuscrito(activar)
    setAviso(
      activar
        ? 'Listo. Este dispositivo va a recibir los recordatorios aunque la app esté cerrada.'
        : 'Este dispositivo ya no va a recibir avisos con la app cerrada.',
    )
  }

  async function probar() {
    setTrabajando(true)
    setAviso(null)
    const { error } = await probarPushDelServidor()
    setTrabajando(false)
    setAviso(
      error
        ? `No se pudo mandar el aviso de prueba: ${error}`
        : 'Aviso de prueba enviado desde el servidor. Debería llegarte en unos segundos, incluso si cerrás la app.',
    )
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
        <span>
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            Avisarme aunque la app esté cerrada
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            El recordatorio lo manda el servidor, así que llega con la app cerrada o el teléfono
            bloqueado. Hay que activarlo en cada dispositivo.
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-checked={suscrito ?? false}
          checked={suscrito ?? false}
          disabled={trabajando || suscrito === null}
          onChange={(e) => cambiar(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-brand-600"
        />
      </label>

      {suscrito && (
        <button
          type="button"
          onClick={probar}
          disabled={trabajando}
          className="mt-2 flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
        >
          {trabajando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Probar aviso del servidor
        </button>
      )}

      {aviso && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{aviso}</p>}
    </div>
  )
}
