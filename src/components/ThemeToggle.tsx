import { Moon, MonitorSmartphone, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '../theme/ThemeContext'

const SIGUIENTE: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const ICONO: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: MonitorSmartphone,
}

const ETIQUETA: Record<ThemePreference, string> = {
  light: 'Tema claro',
  dark: 'Tema oscuro',
  system: 'Tema según el sistema',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = ICONO[theme]

  return (
    <button
      type="button"
      onClick={() => setTheme(SIGUIENTE[theme])}
      aria-label={`${ETIQUETA[theme]}. Tocar para cambiar.`}
      title={ETIQUETA[theme]}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
