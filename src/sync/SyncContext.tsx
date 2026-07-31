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
    const alVolverVisible = () => {
      if (document.visibilityState === 'visible') void sincronizarAhora()
    }
    window.addEventListener('online', alVolverVisible)
    document.addEventListener('visibilitychange', alVolverVisible)

    return () => {
      clearInterval(intervalo)
      window.removeEventListener('online', alVolverVisible)
      document.removeEventListener('visibilitychange', alVolverVisible)
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
