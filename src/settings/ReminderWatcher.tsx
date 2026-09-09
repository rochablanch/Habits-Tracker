import { Bell, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConfiguracion, useHabitos, useRegistrosEnRango } from '../db/hooks'
import { todayISO } from '../utils/date'
import {
  guardarDescartes,
  horaActualHHMM,
  leerDescartes,
  minutosDesde,
  recordatoriosPendientes,
} from './reminders'

/** Ventana en la que el aviso todavía se lee como "es la hora"; después pasa a "quedó pendiente". */
const MINUTOS_RECIEN = 60

function momentoActual() {
  return { fecha: todayISO(), hora: horaActualHHMM() }
}

/**
 * Recordatorios locales v1: mientras la app está abierta, avisa de los hábitos activos
 * cuya hora preferida ya llegó y todavía no fueron registrados hoy. No usa notificaciones
 * del sistema operativo (eso requeriría permiso y, para funcionar con la app cerrada, un
 * servidor) — ver CLAUDE.md.
 */
export function ReminderWatcher() {
  const configuracion = useConfiguracion()
  const habitos = useHabitos({ estado: 'activo' })
  const [ahora, setAhora] = useState(momentoActual)
  const registrosHoy = useRegistrosEnRango(ahora.fecha, ahora.fecha)
  const [descartados, setDescartados] = useState<number[]>(() => leerDescartes(ahora.fecha))

  // Un solo reloj: revisa cada 20s y también apenas la app vuelve a estar visible o
  // enfocada, porque el navegador frena los temporizadores de las pestañas en segundo
  // plano (en el celular, mientras la pantalla está apagada, directamente no corren).
  useEffect(() => {
    function actualizar() {
      setAhora((prev) => {
        const siguiente = momentoActual()
        if (siguiente.fecha === prev.fecha && siguiente.hora === prev.hora) return prev
        return siguiente
      })
    }

    actualizar()
    const intervalo = setInterval(actualizar, 20_000)
    document.addEventListener('visibilitychange', actualizar)
    window.addEventListener('focus', actualizar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', actualizar)
      window.removeEventListener('focus', actualizar)
    }
  }, [])

  // Al cambiar el día, los descartes de ayer dejan de aplicar.
  useEffect(() => {
    setDescartados(leerDescartes(ahora.fecha))
  }, [ahora.fecha])

  const avisos = useMemo(() => {
    if (!configuracion?.recordatoriosActivos || !habitos || !registrosHoy) return []
    return recordatoriosPendientes({
      habitos,
      registradosHoy: new Set(registrosHoy.map((r) => r.habitoId)),
      fecha: ahora.fecha,
      horaActual: ahora.hora,
      descartados,
    })
  }, [configuracion, habitos, registrosHoy, ahora, descartados])

  const descartar = useCallback(
    (id: number) => {
      setDescartados((prev) => {
        const siguiente = prev.includes(id) ? prev : [...prev, id]
        guardarDescartes(ahora.fecha, siguiente)
        return siguiente
      })
    },
    [ahora.fecha],
  )

  if (avisos.length === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-auto flex max-w-2xl flex-col gap-2 px-4">
      {avisos.map((habito) => {
        const reciente = minutosDesde(habito.horaPreferida!, ahora.hora) <= MINUTOS_RECIEN
        return (
          <div
            key={habito.id}
            role="alert"
            className="flex items-center gap-3 rounded-xl border border-brand-200 bg-white p-3 shadow-lg dark:border-brand-900 dark:bg-slate-900"
          >
            <Bell className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">
              {reciente ? (
                <>
                  Es hora de{' '}
                  <strong className="text-slate-900 dark:text-slate-100">{habito.nombre}</strong>
                </>
              ) : (
                <>
                  Te quedó pendiente{' '}
                  <strong className="text-slate-900 dark:text-slate-100">{habito.nombre}</strong>{' '}
                  <span className="text-slate-500 dark:text-slate-400">(era a las {habito.horaPreferida})</span>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => descartar(habito.id)}
              aria-label={`Descartar recordatorio de ${habito.nombre}`}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
