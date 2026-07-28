import { ArchiveRestore, Archive, Copy, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Categoria, Habito } from '../db/types'
import { obtenerIcono } from './icons'

interface HabitCardProps {
  habito: Habito
  categoria?: Categoria
  onPausar: () => void
  onReanudar: () => void
  onArchivar: () => void
  onReactivar: () => void
  onDuplicar: () => void
  onEliminar: () => void
}

function resumenFrecuencia(habito: Habito): string {
  if (habito.frecuencia === 'diaria') return 'Todos los días'
  if (habito.frecuencia === 'x_veces_semana') return `${habito.vecesPorSemana ?? 0} veces por semana`
  const dias = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  return [...habito.diasSemana]
    .sort((a, b) => a - b)
    .map((d) => dias[d])
    .join(' ')
}

export function HabitCard({
  habito,
  categoria,
  onPausar,
  onReanudar,
  onArchivar,
  onReactivar,
  onDuplicar,
  onEliminar,
}: HabitCardProps) {
  const Icon = obtenerIcono(habito.icono)

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: habito.color }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">{habito.nombre}</h3>
            {habito.estado === 'pausado' && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Pausado
              </span>
            )}
            {habito.estado === 'archivado' && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Archivado
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {resumenFrecuencia(habito)}
            {categoria && ` · ${categoria.nombre}`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link
          to={`/habitos/${habito.id}/editar`}
          aria-label={`Editar ${habito.nombre}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Link>

        {habito.estado === 'activo' && (
          <button
            type="button"
            onClick={onPausar}
            aria-label={`Pausar ${habito.nombre}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {habito.estado === 'pausado' && (
          <button
            type="button"
            onClick={onReanudar}
            aria-label={`Reanudar ${habito.nombre}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {habito.estado !== 'archivado' ? (
          <button
            type="button"
            onClick={onArchivar}
            aria-label={`Archivar ${habito.nombre}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onReactivar}
            aria-label={`Reactivar ${habito.nombre}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={onDuplicar}
          aria-label={`Duplicar ${habito.nombre}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onEliminar}
          aria-label={`Eliminar ${habito.nombre}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
