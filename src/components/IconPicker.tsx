import { Search } from 'lucide-react'
import { useState } from 'react'
import { buscarIconos } from '../habits/icons'

interface IconPickerProps {
  value: string
  onChange: (nombre: string) => void
  color: string
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  const [busqueda, setBusqueda] = useState('')
  const resultados = buscarIconos(busqueda)

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar ícono… (ej: agua, ejercicio, dinero)"
          aria-label="Buscar ícono"
          className="mb-2 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div
        role="radiogroup"
        aria-label="Ícono del hábito"
        className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-8"
      >
        {resultados.length === 0 ? (
          <p className="col-span-full py-4 text-center text-sm text-slate-400">
            Ningún ícono coincide con "{busqueda}".
          </p>
        ) : (
          resultados.map(({ nombre, Icon }) => {
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
          })
        )}
      </div>
    </div>
  )
}
