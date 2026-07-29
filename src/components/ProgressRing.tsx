interface ProgressRingProps {
  porcentaje: number
  tamano?: number
  grosor?: number
  etiqueta: string
}

export function ProgressRing({ porcentaje, tamano = 96, grosor = 10, etiqueta }: ProgressRingProps) {
  const radio = (tamano - grosor) / 2
  const circunferencia = 2 * Math.PI * radio
  const progreso = Math.min(100, Math.max(0, porcentaje))
  const offset = circunferencia * (1 - progreso / 100)

  return (
    <div
      role="img"
      aria-label={etiqueta}
      className="relative inline-flex items-center justify-center"
      style={{ width: tamano, height: tamano }}
    >
      <svg width={tamano} height={tamano} className="-rotate-90">
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          strokeWidth={grosor}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          className="stroke-brand-600 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-lg font-semibold text-slate-900 dark:text-slate-100">{progreso}%</span>
    </div>
  )
}
