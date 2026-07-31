import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ColorPicker } from '../components/ColorPicker'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { IconPicker } from '../components/IconPicker'
import { actualizarCategoria, crearCategoria, eliminarCategoria } from '../db/categoriesRepo'
import { useCategorias, useHabitos } from '../db/hooks'
import type { Categoria } from '../db/types'
import { COLOR_POR_DEFECTO } from '../habits/colors'
import { ICONO_POR_DEFECTO, obtenerIcono } from '../habits/icons'

interface FormularioCategoria {
  nombre: string
  icono: string
  color: string
}

const FORMULARIO_VACIO: FormularioCategoria = { nombre: '', icono: ICONO_POR_DEFECTO, color: COLOR_POR_DEFECTO }

export function CategoriesPage() {
  const categorias = useCategorias()
  const habitos = useHabitos({})

  const [editandoId, setEditandoId] = useState<number | 'nueva' | null>(null)
  const [formulario, setFormulario] = useState<FormularioCategoria>(FORMULARIO_VACIO)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<Categoria | null>(null)

  const usosPorCategoria = useMemo(() => {
    const mapa = new Map<number, number>()
    for (const h of habitos ?? []) {
      if (h.categoriaId != null) mapa.set(h.categoriaId, (mapa.get(h.categoriaId) ?? 0) + 1)
    }
    return mapa
  }, [habitos])

  function abrirNueva() {
    setEditandoId('nueva')
    setFormulario(FORMULARIO_VACIO)
    setError(null)
  }

  function abrirEditar(categoria: Categoria) {
    setEditandoId(categoria.id)
    setFormulario({ nombre: categoria.nombre, icono: categoria.icono, color: categoria.color })
    setError(null)
  }

  function cerrarFormulario() {
    setEditandoId(null)
    setFormulario(FORMULARIO_VACIO)
    setError(null)
  }

  async function guardar() {
    const nombre = formulario.nombre.trim()
    if (!nombre) {
      setError('Ponele un nombre a la categoría.')
      return
    }
    if (nombre.length > 40) {
      setError('El nombre es demasiado largo (máximo 40 caracteres).')
      return
    }
    const yaExiste = (categorias ?? []).some(
      (c) => c.nombre.toLowerCase() === nombre.toLowerCase() && c.id !== editandoId,
    )
    if (yaExiste) {
      setError('Ya tenés una categoría con ese nombre.')
      return
    }

    setGuardando(true)
    try {
      if (editandoId === 'nueva') {
        await crearCategoria({ nombre, icono: formulario.icono, color: formulario.color })
      } else if (editandoId !== null) {
        await actualizarCategoria(editandoId, { nombre, icono: formulario.icono, color: formulario.color })
      }
      cerrarFormulario()
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarEliminar() {
    if (!categoriaAEliminar) return
    await eliminarCategoria(categoriaAEliminar.id)
    setCategoriaAEliminar(null)
  }

  const cargando = categorias === undefined
  const usosAEliminar = categoriaAEliminar ? (usosPorCategoria.get(categoriaAEliminar.id) ?? 0) : 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Categorías</h1>
        {editandoId === null && (
          <button
            type="button"
            onClick={abrirNueva}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva categoría
          </button>
        )}
      </div>

      {editandoId !== null && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {editandoId === 'nueva' ? 'Nueva categoría' : 'Editar categoría'}
          </h2>

          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Nombre</span>
            <input
              type="text"
              value={formulario.nombre}
              onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))}
              maxLength={40}
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <div className="mt-3">
            <span className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Color</span>
            <ColorPicker value={formulario.color} onChange={(color) => setFormulario((f) => ({ ...f, color }))} />
          </div>

          <div className="mt-3">
            <span className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Ícono</span>
            <IconPicker
              value={formulario.icono}
              color={formulario.color}
              onChange={(icono) => setFormulario((f) => ({ ...f, icono }))}
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={cerrarFormulario}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        {cargando ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
        ) : categorias.length === 0 ? (
          <EmptyState icon={Tags} title="Todavía no tenés categorías" />
        ) : (
          <ul className="flex flex-col gap-2">
            {categorias.map((categoria) => {
              const Icon = obtenerIcono(categoria.icono)
              const usos = usosPorCategoria.get(categoria.id) ?? 0
              return (
                <li
                  key={categoria.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: categoria.color }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                      {categoria.nombre}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {usos === 0 ? 'Sin hábitos' : usos === 1 ? '1 hábito' : `${usos} hábitos`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => abrirEditar(categoria)}
                    aria-label={`Editar "${categoria.nombre}"`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoriaAEliminar(categoria)}
                    aria-label={`Eliminar "${categoria.nombre}"`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={categoriaAEliminar !== null}
        title={`Eliminar "${categoriaAEliminar?.nombre}"`}
        destructive
        confirmLabel="Eliminar"
        onConfirm={confirmarEliminar}
        onCancel={() => setCategoriaAEliminar(null)}
      >
        {usosAEliminar > 0 ? (
          <p>
            {usosAEliminar} hábito{usosAEliminar === 1 ? '' : 's'} que usa{usosAEliminar === 1 ? '' : 'n'} esta
            categoría {usosAEliminar === 1 ? 'va a quedar' : 'van a quedar'} <strong>sin categoría</strong>. No se
            borra ningún hábito ni su historial.
          </p>
        ) : (
          <p>Esta categoría no tiene hábitos asignados actualmente.</p>
        )}
      </ConfirmDialog>
    </div>
  )
}
