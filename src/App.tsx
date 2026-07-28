import { Moon, Sun, MonitorSmartphone, CheckCircle2 } from 'lucide-react'
import { useTheme, type ThemePreference } from './theme/ThemeContext'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: MonitorSmartphone },
]

const today = new Date()
const fechaFormateada = new Intl.DateTimeFormat('es-UY', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(today)

function App() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="flex items-center gap-3">
        <img src="/icon.svg" alt="" className="h-10 w-10 rounded-xl" />
        <h1 className="text-2xl font-semibold tracking-tight">Hábitos</h1>
      </div>

      <p className="capitalize text-slate-500 dark:text-slate-400">{fechaFormateada}</p>

      <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        <span>Base del proyecto lista (Etapa 0)</span>
      </div>

      <fieldset className="flex gap-2 rounded-2xl border border-slate-200 p-2 dark:border-slate-800">
        <legend className="sr-only">Elegir tema</legend>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={theme === value}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              theme === value
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </fieldset>

      <p className="max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
        Esta pantalla es temporal. El panel principal con tus hábitos se construye en la
        Etapa 3.
      </p>
    </div>
  )
}

export default App
