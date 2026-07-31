import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  Moon,
  MonitorSmartphone,
  Sun,
  Tags,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useConfiguracion } from '../db/hooks'
import { eliminarTodosLosDatos } from '../db/resetRepo'
import { actualizarConfiguracion } from '../db/settingsRepo'
import type { Configuracion } from '../db/types'
import { useAuth } from '../sync/AuthContext'
import { SyncSection } from '../sync/SyncSection'
import { useTheme, type ThemePreference } from '../theme/ThemeContext'
import {
  construirRespaldo,
  nombreArchivoRespaldo,
  restaurarRespaldo,
  validarRespaldo,
  type RespaldoDatos,
} from './backup'

const OPCIONES_TEMA: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: MonitorSmartphone },
]

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{titulo}</h2>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </section>
  )
}

function Interruptor({
  etiqueta,
  descripcion,
  activo,
  onCambiar,
}: {
  etiqueta: string
  descripcion?: string
  activo: boolean
  onCambiar: (valor: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">{etiqueta}</span>
        {descripcion && <span className="block text-xs text-slate-500 dark:text-slate-400">{descripcion}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={activo}
        checked={activo}
        onChange={(e) => onCambiar(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-brand-600"
      />
    </label>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { session } = useAuth()
  const configuracion = useConfiguracion()
  const inputArchivoRef = useRef<HTMLInputElement>(null)

  const [errorImportar, setErrorImportar] = useState<string | null>(null)
  const [respaldoPendiente, setRespaldoPendiente] = useState<RespaldoDatos | null>(null)
  const [importando, setImportando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const [confirmarBorrarTodo, setConfirmarBorrarTodo] = useState(false)
  const [entiendeBorrarTodo, setEntiendeBorrarTodo] = useState(false)

  function cambiarConfig(cambios: Partial<Omit<Configuracion, 'id'>>) {
    void actualizarConfiguracion(cambios)
  }

  async function exportarDatos() {
    const respaldo = await construirRespaldo()
    descargarComoArchivo(respaldo, nombreArchivoRespaldo())
    setMensajeExito('Copia de seguridad descargada.')
  }

  function descargarComoArchivo(datos: unknown, nombre: string) {
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    a.click()
    URL.revokeObjectURL(url)
  }

  async function manejarArchivoSeleccionado(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0]
    event.target.value = ''
    if (!archivo) return

    setErrorImportar(null)
    setMensajeExito(null)

    try {
      const texto = await archivo.text()
      const json = JSON.parse(texto)
      const respaldo = validarRespaldo(json)
      if (!respaldo) {
        setErrorImportar('Este archivo no tiene el formato esperado de una copia de seguridad de Hábitos.')
        return
      }
      setRespaldoPendiente(respaldo)
    } catch {
      setErrorImportar('No se pudo leer el archivo. ¿Es un archivo .json válido exportado desde esta app?')
    }
  }

  async function confirmarImportacion() {
    if (!respaldoPendiente) return
    setImportando(true)
    try {
      // Copia de seguridad automática de lo que había, antes de reemplazarlo.
      const actual = await construirRespaldo()
      descargarComoArchivo(actual, `habitos-backup-automatico-antes-de-importar-${nombreArchivoRespaldo().replace('habitos-backup-', '')}`)

      await restaurarRespaldo(respaldoPendiente)
      setMensajeExito('Datos importados correctamente.')
      setRespaldoPendiente(null)
    } finally {
      setImportando(false)
    }
  }

  async function confirmarBorradoTotal() {
    await eliminarTodosLosDatos()
    setConfirmarBorrarTodo(false)
    setEntiendeBorrarTodo(false)
    setMensajeExito('Se borraron todos los datos.')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-10">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Configuración</h1>

      {mensajeExito && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {mensajeExito}
        </p>
      )}

      <Seccion titulo="Apariencia">
        <fieldset className="flex gap-2">
          <legend className="sr-only">Tema</legend>
          {OPCIONES_TEMA.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={theme === value}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium ${
                theme === value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </fieldset>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Interruptor
            etiqueta="Animaciones"
            descripcion="Transiciones y efectos visuales suaves"
            activo={configuracion?.animaciones ?? true}
            onCambiar={(v) => cambiarConfig({ animaciones: v })}
          />
        </div>
      </Seccion>

      <Seccion titulo="Sincronización">
        <SyncSection />
      </Seccion>

      <Seccion titulo="Categorías">
        <Link
          to="/configuracion/categorias"
          className="flex items-center justify-between gap-2 rounded-xl py-1 text-sm font-medium text-slate-800 hover:text-brand-700 dark:text-slate-200 dark:hover:text-brand-400"
        >
          <span className="flex items-center gap-2">
            <Tags className="h-4 w-4" aria-hidden="true" />
            Crear, editar o eliminar categorías
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </Link>
      </Seccion>

      <Seccion titulo="Fecha">
        <div>
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            Primer día de la semana
          </span>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => cambiarConfig({ primerDiaSemana: 1 })}
              aria-pressed={configuracion?.primerDiaSemana === 1}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                (configuracion?.primerDiaSemana ?? 1) === 1
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              Lunes
            </button>
            <button
              type="button"
              onClick={() => cambiarConfig({ primerDiaSemana: 0 })}
              aria-pressed={configuracion?.primerDiaSemana === 0}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                configuracion?.primerDiaSemana === 0
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              Domingo
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Formato de fecha</span>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => cambiarConfig({ formatoFecha: 'DD/MM/YYYY' })}
              aria-pressed={(configuracion?.formatoFecha ?? 'DD/MM/YYYY') === 'DD/MM/YYYY'}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                (configuracion?.formatoFecha ?? 'DD/MM/YYYY') === 'DD/MM/YYYY'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              DD/MM/AAAA
            </button>
            <button
              type="button"
              onClick={() => cambiarConfig({ formatoFecha: 'MM/DD/YYYY' })}
              aria-pressed={configuracion?.formatoFecha === 'MM/DD/YYYY'}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                configuracion?.formatoFecha === 'MM/DD/YYYY'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              MM/DD/AAAA
            </button>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Panel principal">
        <Interruptor
          etiqueta="Frase motivacional"
          descripcion="Mostrar una frase breve en el panel de hoy"
          activo={configuracion?.frasesMotivacionales ?? true}
          onCambiar={(v) => cambiarConfig({ frasesMotivacionales: v })}
        />
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Interruptor
            etiqueta="Recordatorios"
            descripcion="Avisar cuando llega la hora preferida de un hábito, mientras la app está abierta"
            activo={configuracion?.recordatoriosActivos ?? true}
            onCambiar={(v) => cambiarConfig({ recordatoriosActivos: v })}
          />
        </div>
      </Seccion>

      <Seccion titulo="Copia de seguridad">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Exportá tus hábitos y registros a un archivo para guardarlo en otro lugar (por ejemplo, tu correo o Google
          Drive), o para pasarlos a otro dispositivo.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={exportarDatos}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar datos
          </button>
          <button
            type="button"
            onClick={() => inputArchivoRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Importar datos
          </button>
          <input
            ref={inputArchivoRef}
            type="file"
            accept="application/json"
            onChange={manejarArchivoSeleccionado}
            className="hidden"
          />
        </div>

        {errorImportar && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {errorImportar}
          </p>
        )}
      </Seccion>

      <Seccion titulo="Zona de riesgo">
        <button
          type="button"
          onClick={() => setConfirmarBorrarTodo(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Borrar todos los datos
        </button>
      </Seccion>

      <ConfirmDialog
        open={respaldoPendiente !== null}
        title="Importar datos"
        confirmLabel={importando ? 'Importando…' : 'Reemplazar mis datos'}
        destructive
        confirmDisabled={importando}
        onConfirm={confirmarImportacion}
        onCancel={() => setRespaldoPendiente(null)}
      >
        {respaldoPendiente && (
          <>
            <p>
              Este archivo tiene <strong>{respaldoPendiente.habitos.length} hábitos</strong> y{' '}
              <strong>{respaldoPendiente.registros.length} registros</strong>, exportado el{' '}
              {new Date(respaldoPendiente.exportadoEn).toLocaleDateString('es-UY')}.
            </p>
            <p className="mt-2">
              Esto <strong>reemplaza todos tus datos actuales</strong>. Antes de continuar se va a descargar
              automáticamente una copia de seguridad de lo que tenés ahora, por las dudas.
            </p>
            {session && (
              <p className="mt-2 text-amber-700 dark:text-amber-400">
                Tenés la sincronización activa: los datos que reemplazás acá pueden no borrarse en tus otros
                dispositivos hasta que también importes ahí, o cierres sesión antes de importar.
              </p>
            )}
          </>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmarBorrarTodo}
        title="Borrar todos los datos"
        confirmLabel="Borrar todo"
        destructive
        confirmDisabled={!entiendeBorrarTodo}
        onConfirm={confirmarBorradoTotal}
        onCancel={() => {
          setConfirmarBorrarTodo(false)
          setEntiendeBorrarTodo(false)
        }}
      >
        <p>
          Se van a borrar <strong>todos</strong> tus hábitos, registros y categorías, sin posibilidad de
          recuperarlos. Considerá exportar una copia de seguridad antes.
        </p>
        <label className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-950 dark:text-red-300">
          <input
            type="checkbox"
            checked={entiendeBorrarTodo}
            onChange={(e) => setEntiendeBorrarTodo(e.target.checked)}
            className="mt-1"
          />
          <span>Entiendo que esta acción no se puede deshacer.</span>
        </label>
      </ConfirmDialog>
    </div>
  )
}
