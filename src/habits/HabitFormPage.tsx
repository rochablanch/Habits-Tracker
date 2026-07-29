import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ColorPicker } from '../components/ColorPicker'
import { EmptyState } from '../components/EmptyState'
import { IconPicker } from '../components/IconPicker'
import { useCategorias, useHabito } from '../db/hooks'
import { actualizarHabito, crearHabito } from '../db/habitsRepo'
import { COLOR_POR_DEFECTO } from './colors'
import { DIAS_SEMANA, FRECUENCIAS, PRIORIDADES, TIPOS_HABITO, tipoUsaMeta, type DatosFormularioHabito } from './formTypes'
import { ICONO_POR_DEFECTO } from './icons'
import { formularioAHabito, habitoAFormulario, validarHabito, type ErroresFormularioHabito } from './validation'
import { todayISO } from '../utils/date'
import { AlertCircle, Ban } from 'lucide-react'

const FORMULARIO_VACIO: DatosFormularioHabito = {
  nombre: '',
  descripcion: '',
  icono: ICONO_POR_DEFECTO,
  color: COLOR_POR_DEFECTO,
  categoriaId: null,
  fechaInicio: todayISO(),
  tipo: 'si_no',
  frecuencia: 'diaria',
  diasSemana: [],
  vecesPorSemana: '3',
  vecesPorDia: '1',
  unidadMedida: '',
  metaCantidad: '',
  horaPreferida: '',
  recordatorio: false,
  prioridad: 'media',
  notas: '',
}

function campoInvalido(mensaje?: string) {
  if (!mensaje) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {mensaje}
    </p>
  )
}

export function HabitFormPage() {
  const params = useParams<{ id: string }>()
  const idEdicion = params.id ? Number(params.id) : undefined
  const esEdicion = idEdicion !== undefined
  const habitoExistente = useHabito(idEdicion)
  const categorias = useCategorias()
  const navigate = useNavigate()

  const [datos, setDatos] = useState<DatosFormularioHabito>(FORMULARIO_VACIO)
  const [errores, setErrores] = useState<ErroresFormularioHabito>({})
  const [guardando, setGuardando] = useState(false)
  const [inicializado, setInicializado] = useState(!esEdicion)

  useEffect(() => {
    if (esEdicion && habitoExistente) {
      setDatos(habitoAFormulario(habitoExistente))
      setInicializado(true)
    }
  }, [esEdicion, habitoExistente])

  function actualizarCampo<K extends keyof DatosFormularioHabito>(campo: K, valor: DatosFormularioHabito[K]) {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
  }

  function alternarDia(dia: number) {
    setDatos((prev) => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter((d) => d !== dia)
        : [...prev.diasSemana, dia],
    }))
  }

  async function manejarEnvio(event: FormEvent) {
    event.preventDefault()
    const erroresEncontrados = validarHabito(datos)
    setErrores(erroresEncontrados)
    if (Object.keys(erroresEncontrados).length > 0) return

    setGuardando(true)
    try {
      const payload = formularioAHabito(datos)
      if (esEdicion && idEdicion) {
        await actualizarHabito(idEdicion, payload)
      } else {
        await crearHabito({ ...payload, estado: 'activo' })
      }
      navigate('/habitos')
    } finally {
      setGuardando(false)
    }
  }

  if (esEdicion && habitoExistente === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={Ban}
          title="No encontramos ese hábito"
          description="Puede que ya haya sido eliminado."
          action={
            <Link to="/habitos" className="mt-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
              Volver a mis hábitos
            </Link>
          }
        />
      </div>
    )
  }

  if (!inicializado) {
    return <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
  }

  const inputClase =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
  const labelClase = 'block text-sm font-medium text-slate-700 dark:text-slate-300'

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        {esEdicion ? 'Editar hábito' : 'Nuevo hábito'}
      </h1>

      <form onSubmit={manejarEnvio} noValidate className="mt-6 flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Datos básicos</h2>

          <div>
            <label className={labelClase} htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={datos.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              className={inputClase}
              maxLength={60}
              aria-invalid={Boolean(errores.nombre)}
            />
            {campoInvalido(errores.nombre)}
          </div>

          <div>
            <label className={labelClase} htmlFor="descripcion">
              Descripción <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="descripcion"
              value={datos.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
              className={inputClase}
              rows={2}
            />
          </div>

          <div>
            <label className={labelClase} htmlFor="categoria">
              Categoría
            </label>
            <select
              id="categoria"
              value={datos.categoriaId ?? ''}
              onChange={(e) => actualizarCampo('categoriaId', e.target.value ? Number(e.target.value) : null)}
              className={inputClase}
            >
              <option value="">Sin categoría</option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={labelClase}>Ícono</span>
            <div className="mt-1">
              <IconPicker value={datos.icono} onChange={(v) => actualizarCampo('icono', v)} color={datos.color} />
            </div>
          </div>

          <div>
            <span className={labelClase}>Color</span>
            <div className="mt-1">
              <ColorPicker value={datos.color} onChange={(v) => actualizarCampo('color', v)} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Tipo de hábito</h2>

          <div role="radiogroup" aria-label="Tipo de hábito" className="flex flex-col gap-2">
            {TIPOS_HABITO.map((t) => (
              <label
                key={t.value}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border p-3 text-sm ${
                  datos.tipo === t.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="tipo"
                    checked={datos.tipo === t.value}
                    onChange={() => actualizarCampo('tipo', t.value)}
                  />
                  {t.label}
                </span>
                <span className="pl-5 text-slate-500 dark:text-slate-400">{t.ayuda}</span>
              </label>
            ))}
          </div>

          {tipoUsaMeta(datos.tipo) && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClase} htmlFor="metaCantidad">
                  Meta
                </label>
                <input
                  id="metaCantidad"
                  type="number"
                  min={0}
                  value={datos.metaCantidad}
                  onChange={(e) => actualizarCampo('metaCantidad', e.target.value)}
                  className={inputClase}
                  aria-invalid={Boolean(errores.metaCantidad)}
                />
                {campoInvalido(errores.metaCantidad)}
              </div>
              <div className="flex-1">
                <label className={labelClase} htmlFor="unidadMedida">
                  Unidad <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  id="unidadMedida"
                  type="text"
                  placeholder="litros, minutos…"
                  value={datos.unidadMedida}
                  onChange={(e) => actualizarCampo('unidadMedida', e.target.value)}
                  className={inputClase}
                />
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Frecuencia</h2>

          <div>
            <label className={labelClase} htmlFor="frecuencia">
              Repetición
            </label>
            <select
              id="frecuencia"
              value={datos.frecuencia}
              onChange={(e) => actualizarCampo('frecuencia', e.target.value as DatosFormularioHabito['frecuencia'])}
              className={inputClase}
            >
              {FRECUENCIAS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {datos.frecuencia === 'dias_semana' && (
            <div>
              <span className={labelClase}>Días</span>
              <div role="group" aria-label="Días de la semana" className="mt-1 flex gap-1.5">
                {DIAS_SEMANA.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    aria-pressed={datos.diasSemana.includes(d.value)}
                    onClick={() => alternarDia(d.value)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                      datos.diasSemana.includes(d.value)
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {campoInvalido(errores.diasSemana)}
            </div>
          )}

          {datos.frecuencia === 'x_veces_semana' && (
            <div>
              <label className={labelClase} htmlFor="vecesPorSemana">
                Veces por semana
              </label>
              <input
                id="vecesPorSemana"
                type="number"
                min={1}
                max={7}
                value={datos.vecesPorSemana}
                onChange={(e) => actualizarCampo('vecesPorSemana', e.target.value)}
                className={inputClase}
                aria-invalid={Boolean(errores.vecesPorSemana)}
              />
              {campoInvalido(errores.vecesPorSemana)}
            </div>
          )}

          <div>
            <label className={labelClase} htmlFor="vecesPorDia">
              Veces por día
            </label>
            <input
              id="vecesPorDia"
              type="number"
              min={1}
              value={datos.vecesPorDia}
              onChange={(e) => actualizarCampo('vecesPorDia', e.target.value)}
              className={inputClase}
              aria-invalid={Boolean(errores.vecesPorDia)}
            />
            {campoInvalido(errores.vecesPorDia)}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Fecha y recordatorio</h2>

          <div>
            <label className={labelClase} htmlFor="fechaInicio">
              Fecha de inicio
            </label>
            <input
              id="fechaInicio"
              type="date"
              value={datos.fechaInicio}
              onChange={(e) => actualizarCampo('fechaInicio', e.target.value)}
              className={inputClase}
              aria-invalid={Boolean(errores.fechaInicio)}
            />
            {campoInvalido(errores.fechaInicio)}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="recordatorio"
              type="checkbox"
              checked={datos.recordatorio}
              onChange={(e) => actualizarCampo('recordatorio', e.target.checked)}
              className="h-5 w-5"
            />
            <label htmlFor="recordatorio" className="text-sm text-slate-700 dark:text-slate-300">
              Activar recordatorio
            </label>
          </div>

          <div>
            <label className={labelClase} htmlFor="horaPreferida">
              Hora preferida {!datos.recordatorio && <span className="font-normal text-slate-400">(opcional)</span>}
            </label>
            <input
              id="horaPreferida"
              type="time"
              value={datos.horaPreferida}
              onChange={(e) => actualizarCampo('horaPreferida', e.target.value)}
              className={inputClase}
              aria-invalid={Boolean(errores.horaPreferida)}
            />
            {campoInvalido(errores.horaPreferida)}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Otros</h2>

          <div>
            <label className={labelClase} htmlFor="prioridad">
              Prioridad
            </label>
            <select
              id="prioridad"
              value={datos.prioridad}
              onChange={(e) => actualizarCampo('prioridad', e.target.value as DatosFormularioHabito['prioridad'])}
              className={inputClase}
            >
              {PRIORIDADES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClase} htmlFor="notas">
              Notas <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="notas"
              value={datos.notas}
              onChange={(e) => actualizarCampo('notas', e.target.value)}
              className={inputClase}
              rows={3}
              maxLength={500}
              aria-invalid={Boolean(errores.notas)}
            />
            {campoInvalido(errores.notas)}
          </div>
        </section>

        <div className="sticky bottom-20 z-30 flex gap-2 rounded-xl bg-white/90 p-2 shadow-lg backdrop-blur dark:bg-slate-950/90">
          <Link
            to="/habitos"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
