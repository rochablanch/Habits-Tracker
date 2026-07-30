import { Check, ClipboardCheck, LineChart, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCategorias } from '../db/hooks'
import { crearHabito } from '../db/habitsRepo'
import { actualizarConfiguracion } from '../db/settingsRepo'
import { obtenerIcono } from '../habits/icons'
import { todayISO } from '../utils/date'
import { HABITOS_SUGERIDOS, resolverHabitoSugerido } from './suggestedHabits'

type Paso = 'bienvenida' | 'sugeridos'

async function terminarOnboarding(navigate: (ruta: string) => void) {
  await actualizarConfiguracion({ onboardingCompletado: true })
  navigate('/')
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const categorias = useCategorias()
  const [paso, setPaso] = useState<Paso>('bienvenida')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [guardando, setGuardando] = useState(false)

  function alternarSeleccion(nombre: string) {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(nombre)) nuevo.delete(nombre)
      else nuevo.add(nombre)
      return nuevo
    })
  }

  async function agregarSeleccionadosYContinuar() {
    if (!categorias) return
    setGuardando(true)
    try {
      const hoy = todayISO()
      const elegidos = HABITOS_SUGERIDOS.filter((h) => seleccionados.has(h.nombre))
      for (const sugerido of elegidos) {
        await crearHabito(resolverHabitoSugerido(sugerido, categorias, hoy))
      }
      await terminarOnboarding(navigate)
    } finally {
      setGuardando(false)
    }
  }

  async function crearHabitoPropio() {
    await actualizarConfiguracion({ onboardingCompletado: true })
    navigate('/habitos/nuevo')
  }

  if (paso === 'bienvenida') {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <img src="/icon.svg" alt="" className="h-16 w-16 rounded-2xl" />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">Bienvenido a Hábitos</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Una app simple y privada para crear hábitos, registrarlos día a día, y ver tu constancia con el tiempo.
          Todo se guarda en este dispositivo — sin cuentas, sin conexión a internet necesaria.
        </p>

        <div className="mt-6 flex w-full flex-col gap-3 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Marcá tus hábitos cada día desde el panel principal.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Revisá y editá cualquier día pasado desde el calendario.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <LineChart className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Mirá tu progreso y tus rachas en estadísticas.
            </p>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={() => setPaso('sugeridos')}
            className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Empezar
          </button>
          <button
            type="button"
            onClick={() => terminarOnboarding(navigate)}
            className="rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Saltar la introducción
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-10">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Elegí algunos hábitos para empezar
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Son solo sugerencias, opcionales. Podés elegir varios, uno solo, o ninguno y crear los tuyos propios.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {HABITOS_SUGERIDOS.map((sugerido) => {
          const Icon = obtenerIcono(sugerido.icono)
          const elegido = seleccionados.has(sugerido.nombre)
          return (
            <button
              key={sugerido.nombre}
              type="button"
              onClick={() => alternarSeleccion(sugerido.nombre)}
              aria-pressed={elegido}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left ${
                elegido
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: sugerido.color }}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-200">{sugerido.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sugerido.resumen}</p>
              </div>
              {elegido && <Check className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={agregarSeleccionadosYContinuar}
          disabled={seleccionados.size === 0 || guardando}
          className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? 'Agregando…' : `Agregar ${seleccionados.size > 0 ? seleccionados.size : ''} y continuar`}
        </button>
        <button
          type="button"
          onClick={crearHabitoPropio}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300"
        >
          Prefiero crear el mío propio
        </button>
        <button
          type="button"
          onClick={() => terminarOnboarding(navigate)}
          className="rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Saltar la introducción
        </button>
      </div>
    </div>
  )
}
