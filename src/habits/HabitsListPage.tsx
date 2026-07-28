import { ListChecks, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { useCategorias, useHabitos } from '../db/hooks'
import type { EstadoHabito, Habito } from '../db/types'
import {
  archivarHabito,
  duplicarHabito,
  eliminarHabito,
  pausarHabito,
  reactivarHabito,
} from '../db/habitsRepo'
import { HabitCard } from './HabitCard'

type Pestana = 'activo' | 'pausado' | 'archivado'
type Orden = 'nombre' | 'prioridad' | 'reciente'

const PESTANAS: { value: Pestana; label: string }[] = [
  { value: 'activo', label: 'Activos' },
  { value: 'pausado', label: 'Pausados' },
  { value: 'archivado', label: 'Archivados' },
]

const PESO_PRIORIDAD: Record<Habito['prioridad'], number> = { alta: 0, media: 1, baja: 2 }

export function HabitsListPage() {
  const [pestana, setPestana] = useState<Pestana>('activo')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | 'todas'>('todas')
  const [orden, setOrden] = useState<Orden>('nombre')
  const [habitoAEliminar, setHabitoAEliminar] = useState<Habito | null>(null)
  const [borrarHistorial, setBorrarHistorial] = useState(false)
  const [confirmoIrreversible, setConfirmoIrreversible] = useState(false)

  const habitos = useHabitos({ estado: pestana as EstadoHabito })
  const categorias = useCategorias()
  const categoriasPorId = useMemo(() => new Map((categorias ?? []).map((c) => [c.id, c])), [categorias])

  const habitosFiltrados = useMemo(() => {
    if (!habitos) return undefined
    const texto = busqueda.trim().toLowerCase()
    let resultado = habitos.filter((h) => {
      const coincideTexto = !texto || h.nombre.toLowerCase().includes(texto)
      const coincideCategoria = categoriaId === 'todas' || h.categoriaId === categoriaId
      return coincideTexto && coincideCategoria
    })
    resultado = [...resultado].sort((a, b) => {
      if (orden === 'nombre') return a.nombre.localeCompare(b.nombre, 'es')
      if (orden === 'prioridad') return PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad]
      return b.createdAt.localeCompare(a.createdAt)
    })
    return resultado
  }, [habitos, busqueda, categoriaId, orden])

  function cerrarDialogoEliminar() {
    setHabitoAEliminar(null)
    setBorrarHistorial(false)
    setConfirmoIrreversible(false)
  }

  async function confirmarEliminar() {
    if (!habitoAEliminar?.id) return
    await eliminarHabito(habitoAEliminar.id, { borrarHistorial })
    cerrarDialogoEliminar()
  }

  const cargando = habitosFiltrados === undefined
  const sinHabitosEnAbsoluto = habitos?.length === 0 && !busqueda && categoriaId === 'todas'

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tus hábitos</h1>
        <Link
          to="/habitos/nuevo"
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo hábito
        </Link>
      </div>

      <div className="mt-4 flex gap-1 rounded-xl border border-slate-200 p-1 dark:border-slate-800">
        {PESTANAS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPestana(p.value)}
            aria-pressed={pestana === p.value}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pestana === p.value
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar hábito…"
            aria-label="Buscar hábito"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
          aria-label="Filtrar por categoría"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="todas">Todas las categorías</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as Orden)}
          aria-label="Ordenar por"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="nombre">Nombre</option>
          <option value="prioridad">Prioridad</option>
          <option value="reciente">Más recientes</option>
        </select>
      </div>

      <div className="mt-4">
        {cargando ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
        ) : sinHabitosEnAbsoluto ? (
          <EmptyState
            icon={ListChecks}
            title={
              pestana === 'activo'
                ? 'Todavía no tenés hábitos activos'
                : `No hay hábitos ${pestana === 'pausado' ? 'pausados' : 'archivados'}`
            }
            description={pestana === 'activo' ? 'Creá tu primer hábito para empezar a registrar tu constancia.' : undefined}
            action={
              pestana === 'activo' && (
                <Link
                  to="/habitos/nuevo"
                  className="mt-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Crear hábito
                </Link>
              )
            }
          />
        ) : habitosFiltrados!.length === 0 ? (
          <EmptyState icon={Search} title="Ningún hábito coincide con la búsqueda o el filtro" />
        ) : (
          <ul className="flex flex-col gap-3">
            {habitosFiltrados!.map((habito) => (
              <HabitCard
                key={habito.id}
                habito={habito}
                categoria={habito.categoriaId ? categoriasPorId.get(habito.categoriaId) : undefined}
                onPausar={() => pausarHabito(habito.id)}
                onReanudar={() => reactivarHabito(habito.id)}
                onArchivar={() => archivarHabito(habito.id)}
                onReactivar={() => reactivarHabito(habito.id)}
                onDuplicar={() => duplicarHabito(habito.id)}
                onEliminar={() => setHabitoAEliminar(habito)}
              />
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={habitoAEliminar !== null}
        title={`Eliminar "${habitoAEliminar?.nombre}"`}
        destructive
        confirmLabel="Eliminar"
        confirmDisabled={borrarHistorial && !confirmoIrreversible}
        onConfirm={confirmarEliminar}
        onCancel={cerrarDialogoEliminar}
      >
        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="modo-eliminar"
              checked={!borrarHistorial}
              onChange={() => setBorrarHistorial(false)}
              className="mt-1"
            />
            <span>
              <strong className="text-slate-800 dark:text-slate-200">Eliminar, pero conservar el historial.</strong>{' '}
              El hábito desaparece de tus listas, pero sus registros pasados se mantienen en las estadísticas.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="modo-eliminar"
              checked={borrarHistorial}
              onChange={() => setBorrarHistorial(true)}
              className="mt-1"
            />
            <span>
              <strong className="text-slate-800 dark:text-slate-200">Eliminar todo, incluyendo el historial.</strong>{' '}
              Esto es permanente: se borran también todos los registros diarios de este hábito.
            </span>
          </label>

          {borrarHistorial && (
            <label className="flex items-start gap-2 rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-950 dark:text-red-300">
              <input
                type="checkbox"
                checked={confirmoIrreversible}
                onChange={(e) => setConfirmoIrreversible(e.target.checked)}
                className="mt-1"
              />
              <span>Entiendo que esta acción no se puede deshacer.</span>
            </label>
          )}
        </div>
      </ConfirmDialog>
    </div>
  )
}
