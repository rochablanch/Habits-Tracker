import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PuntoEvolucion } from './metrics'

interface EvolutionChartProps {
  datos: PuntoEvolucion[]
  formatearEtiqueta: (clave: string) => string
}

interface TooltipPayloadItem {
  payload: PuntoEvolucion & { etiqueta: string }
}

function TooltipPersonalizado({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const punto = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="font-medium text-slate-800 dark:text-slate-200">{punto.etiqueta}</p>
      <p className="text-slate-500 dark:text-slate-400">
        {punto.porcentaje === null ? 'Sin hábitos' : `${punto.porcentaje}% (${punto.logrados}/${punto.aplicables})`}
      </p>
    </div>
  )
}

export function EvolutionChart({ datos, formatearEtiqueta }: EvolutionChartProps) {
  const datosGrafico = datos.map((d) => ({ ...d, etiqueta: formatearEtiqueta(d.clave), valor: d.porcentaje ?? 0 }))

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datosGrafico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
          <XAxis
            dataKey="etiqueta"
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: 'currentColor' }}
            className="text-slate-400"
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: 'currentColor', opacity: 0.06 }} />
          <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
