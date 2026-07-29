import type { CumplimientoCategoria } from './metrics'

export function CategoryBreakdown({ items }: { items: CumplimientoCategoria[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Sin datos en este período.</p>
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => {
        const color = item.categoria?.color ?? '#64748b'
        const nombre = item.categoria?.nombre ?? 'Sin categoría'
        return (
          <li key={item.categoria?.id ?? 'sin-categoria'}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {nombre}
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{item.porcentaje}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.porcentaje ?? 0}%`, backgroundColor: color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
