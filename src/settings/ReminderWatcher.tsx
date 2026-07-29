import { Bell, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useConfiguracion, useHabitos, useRegistrosEnRango } from '../db/hooks'
import type { Habito } from '../db/types'
import { aplicaEnFecha } from '../habits/dailyStatus'
import { todayISO } from '../utils/date'

function horaActualHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Recordatorios locales v1: mientras la app está abierta, revisa cada 20s si algún
 * hábito activo tiene su hora preferida y todavía no fue registrado hoy. No usa
 * notificaciones del sistema operativo (eso requeriría permiso y, para funcionar con
 * la app cerrada, un servidor) — ver CLAUDE.md.
 */
export function ReminderWatcher() {
  const configuracion = useConfiguracion()
  const habitos = useHabitos({ estado: 'activo' })
  const hoy = todayISO()
  const registrosHoy = useRegistrosEnRango(hoy, hoy)
  const [avisos, setAvisos] = useState<Habito[]>([])
  const avisadoEnMinuto = useRef<Map<number, string>>(new Map())

  useEffect(() => {
    if (!configuracion?.recordatoriosActivos || !habitos || !registrosHoy) return

    function revisar() {
      const horaActual = horaActualHHMM()
      const registradosHoy = new Set(registrosHoy!.map((r) => r.habitoId))
      const paraAvisar = habitos!.filter(
        (h) =>
          h.recordatorio &&
          h.horaPreferida === horaActual &&
          aplicaEnFecha(h, hoy) &&
          !registradosHoy.has(h.id) &&
          avisadoEnMinuto.current.get(h.id) !== horaActual,
      )
      if (paraAvisar.length > 0) {
        paraAvisar.forEach((h) => avisadoEnMinuto.current.set(h.id, horaActual))
        setAvisos((prev) => [...prev, ...paraAvisar])
      }
    }

    revisar()
    const intervalo = setInterval(revisar, 20_000)
    return () => clearInterval(intervalo)
  }, [configuracion, habitos, registrosHoy, hoy])

  function descartar(id: number) {
    setAvisos((prev) => prev.filter((h) => h.id !== id))
  }

  if (avisos.length === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-auto flex max-w-2xl flex-col gap-2 px-4">
      {avisos.map((habito) => (
        <div
          key={habito.id}
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-brand-200 bg-white p-3 shadow-lg dark:border-brand-900 dark:bg-slate-900"
        >
          <Bell className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
          <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">
            Es hora de <strong className="text-slate-900 dark:text-slate-100">{habito.nombre}</strong>
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
      ))}
    </div>
  )
}
