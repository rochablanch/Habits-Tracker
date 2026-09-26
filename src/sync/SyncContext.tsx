import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { reiniciarCursorSync, sincronizar } from './syncEngine'

const INTERVALO_MS = 60_000

interface SyncContextValue {
  sincronizando: boolean
  ultimaSincronizacion: Date | null
  error: string | null
  sincronizarAhora: () => Promise<void>
  sincronizarDeNuevoDesdeCero: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

export function SyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [sincronizando, setSincronizando] = useState(false)
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const enCurso = useRef(false)

  const sincronizarAhora = useCallback(async () => {
    if (!session || enCurso.current) return
    enCurso.current = true
    setSincronizando(true)
    setError(null)
    try {
      await sincronizar(session.user.id)
      setUltimaSincronizacion(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo sincronizar.')
    } finally {
      setSincronizando(false)
      enCurso.current = false
    }
  }, [session])

  const sincronizarDeNuevoDesdeCero = useCallback(async () => {
    reiniciarCursorSync()
    await sincronizarAhora()
  }, [sincronizarAhora])

  useEffect(() => {
    if (!session) return
    void sincronizarAhora()

    const intervalo = setInterval(() => void sincronizarAhora(), INTERVALO_MS)
    // También al *irse* la app a segundo plano, no solo al volver: es el último momento en que
    // se puede subir lo recién hecho antes de que el navegador la congele. Sin esto, un hábito
    // creado y seguido de cerrar la app podía no llegar nunca al servidor, y entonces el
    // recordatorio de ese hábito no salía.
    const alCambiarVisibilidad = () => void sincronizarAhora()
    window.addEventListener('online', alCambiarVisibilidad)
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    return () => {
      clearInterval(intervalo)
      window.removeEventListener('online', alCambiarVisibilidad)
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [session, sincronizarAhora])

  return (
    <SyncContext.Provider
      value={{ sincronizando, ultimaSincronizacion, error, sincronizarAhora, sincronizarDeNuevoDesdeCero }}
    >
      {children}
    </SyncContext.Provider>
  )
}

export function useSync(): SyncContextValue {
  const contexto = useContext(SyncContext)
  if (!contexto) throw new Error('useSync debe usarse dentro de <SyncProvider>')
  return contexto
}
