import { useEffect } from 'react'
import { useConfiguracion } from '../db/hooks'

/** Aplica la preferencia de "Animaciones" de Configuración a toda la app (sin renderizar nada). */
export function AnimationsEffect() {
  const configuracion = useConfiguracion()

  useEffect(() => {
    if (configuracion === undefined) return
    document.documentElement.classList.toggle('reducir-animaciones', !configuracion.animaciones)
  }, [configuracion])

  return null
}
