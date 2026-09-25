import { useEffect, useRef } from 'react'

/** Después de este tiempo minimizada, la app se vuelve a cargar al abrirla. */
const LIMITE_MS = 4 * 60 * 60 * 1000

/**
 * Recarga la app si estuvo mucho tiempo en segundo plano (no renderiza nada).
 *
 * Motivo (problema real): en el celular, el navegador *congela* una app minimizada a los
 * pocos minutos y después la deja en un estado del que no siempre se recupera bien — se
 * frenan los temporizadores, la conexión con la base local puede quedar cortada, y sigue
 * corriendo la versión del código que se cargó el primer día aunque ya haya una más nueva
 * publicada. El síntoma era que los recordatorios dejaban de aparecer después de unos días
 * de tener la app siempre minimizada.
 *
 * Volver a cargar es instantáneo (todo es local) y deja la app en un estado limpio.
 */
export function StaleReload() {
  const ocultaDesde = useRef<number | null>(null)

  useEffect(() => {
    function alCambiarVisibilidad() {
      if (document.hidden) {
        ocultaDesde.current = Date.now()
        return
      }
      const desde = ocultaDesde.current
      ocultaDesde.current = null
      if (desde !== null && Date.now() - desde > LIMITE_MS) window.location.reload()
    }

    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  }, [])

  return null
}
