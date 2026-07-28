import { Check } from 'lucide-react'
import { COLORES_HABITO } from '../habits/colors'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div role="radiogroup" aria-label="Color del hábito" className="flex flex-wrap gap-2">
      {COLORES_HABITO.map((color) => {
        const seleccionado = color === value
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            aria-label={color}
            onClick={() => onChange(color)}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform"
            style={{ backgroundColor: color, borderColor: seleccionado ? color : 'transparent' }}
          >
            {seleccionado && <Check className="h-5 w-5 text-white" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}
