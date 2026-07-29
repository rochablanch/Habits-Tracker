import { hayDatosSuficientes, type CumplimientoDiaSemana } from './metrics'

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const INICIAL_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export function WeekdayBreakdown({ items }: { items: CumplimientoDiaSemana[] }) {
  const totalAplicables = items.reduce((acc, i) => acc + i.aplicables, 0)
  const conDatos = items.filter((i) => i.porcentaje !== null)
  const mejor =
    conDatos.length > 0 && hayDatosSuficientes(totalAplicables)
      ? conDatos.reduce((a, b) => (b.porcentaje! > a.porcentaje! ? b : a))
      : null

  if (conDatos.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Sin datos en este período.</p>
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-1.5">
        {items.map((item) => {
          const esMejor = mejor && item.diaSemana === mejor.diaSemana
          return (
            <div key={item.diaSemana} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="h-16 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800"
                title={`${NOMBRES_DIA[item.diaSemana]}: ${item.porcentaje === null ? 'sin datos' : `${item.porcentaje}%`}`}
              >
                <div
                  className={`w-full ${esMejor ? 'bg-emerald-500' : 'bg-brand-400'}`}
                  style={{
                    height: `${item.porcentaje ?? 0}%`,
                    marginTop: `${100 - (item.porcentaje ?? 0)}%`,
                  }}
                />
              </div>
              <span
                className={`text-xs ${esMejor ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
              >
                {INICIAL_DIA[item.diaSemana]}
              </span>
            </div>
          )
        })}
      </div>
      {mejor ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Tu mejor día es <strong className="text-slate-800 dark:text-slate-200">{NOMBRES_DIA[mejor.diaSemana]}</strong>{' '}
          ({mejor.porcentaje}%).
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Todavía no hay datos suficientes para saber tu mejor día.</p>
      )}
    </div>
  )
}
