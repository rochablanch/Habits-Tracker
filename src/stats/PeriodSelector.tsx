import { PERIODOS, type PeriodoId, type RangoFechas } from './period'

interface PeriodSelectorProps {
  periodo: PeriodoId
  personalizado: RangoFechas
  onCambiarPeriodo: (periodo: PeriodoId) => void
  onCambiarPersonalizado: (rango: RangoFechas) => void
}

export function PeriodSelector({
  periodo,
  personalizado,
  onCambiarPeriodo,
  onCambiarPersonalizado,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PERIODOS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onCambiarPeriodo(p.value)}
            aria-pressed={periodo === p.value}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              periodo === p.value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodo === 'personalizado' && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={personalizado.desde}
            max={personalizado.hasta}
            onChange={(e) => onCambiarPersonalizado({ ...personalizado, desde: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          <span className="text-slate-400">a</span>
          <input
            type="date"
            value={personalizado.hasta}
            min={personalizado.desde}
            onChange={(e) => onCambiarPersonalizado({ ...personalizado, hasta: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      )}
    </div>
  )
}
