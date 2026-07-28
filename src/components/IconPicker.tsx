import { ICONOS_HABITO } from '../habits/icons'

interface IconPickerProps {
  value: string
  onChange: (nombre: string) => void
  color: string
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Ícono del hábito"
      className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-8"
    >
      {ICONOS_HABITO.map(({ nombre, Icon }) => {
        const seleccionado = nombre === value
        return (
          <button
            key={nombre}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            aria-label={nombre}
            onClick={() => onChange(nombre)}
            className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
              seleccionado
                ? 'border-transparent text-white'
                : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            style={seleccionado ? { backgroundColor: color } : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
