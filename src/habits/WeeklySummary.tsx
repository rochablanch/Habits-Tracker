import type { ResumenDia } from './summary'

const NOMBRES_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function nombreDia(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number)
  return NOMBRES_DIA[new Date(year, month - 1, day).getDay()]
}

function colorBarra(porcentaje: number | null): string {
  if (porcentaje === null) return 'bg-slate-100 dark:bg-slate-800'
  if (porcentaje >= 100) return 'bg-emerald-500'
  if (porcentaje > 0) return 'bg-amber-400'
  return 'bg-slate-200 dark:bg-slate-700'
}

export function WeeklySummary({ resumen }: { resumen: ResumenDia[] }) {
  const diasConDatos = resumen.filter((d) => d.porcentaje !== null)
  const promedio =
    diasConDatos.length > 0
      ? Math.round(diasConDatos.reduce((acc, d) => acc + (d.porcentaje ?? 0), 0) / diasConDatos.length)
      : null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Últimos 7 días</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {promedio === null ? 'Sin datos todavía' : `${promedio}% de cumplimiento`}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-1.5">
        {resumen.map((dia) => (
          <div key={dia.fecha} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="h-14 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800"
              title={dia.porcentaje === null ? 'Sin hábitos ese día' : `${dia.porcentaje}%`}
            >
              <div
                className={`w-full ${colorBarra(dia.porcentaje)}`}
                style={{ height: `${dia.porcentaje ?? 0}%`, marginTop: `${100 - (dia.porcentaje ?? 0)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{nombreDia(dia.fecha)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
