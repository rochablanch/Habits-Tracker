import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useConfiguracion } from '../db/hooks'

/** Manda a la introducción inicial si todavía no se completó (o saltó). */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const configuracion = useConfiguracion()

  if (configuracion === undefined) return null
  if (!configuracion.onboardingCompletado) return <Navigate to="/bienvenida" replace />

  return children
}
