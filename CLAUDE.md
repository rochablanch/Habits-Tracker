# CLAUDE.md — Hábitos

Contexto del proyecto para quien (humano o IA) retome el trabajo. El usuario no programa: las decisiones técnicas las toma Claude, explicadas en español simple en el chat.

## Qué es

App web personal (sin login, sin backend) para crear hábitos, registrarlos día a día, y analizarlos con calendario y estadísticas. Debe funcionar offline y ser instalable como PWA. Idioma español, contexto Uruguay (formato de fecha DD/MM/AAAA, semana empieza lunes por defecto).

## Stack elegido

- **React + TypeScript + Vite**: interfaz, tipado y velocidad de desarrollo.
- **Dexie.js sobre IndexedDB**: base de datos local en el navegador, persistente entre sesiones.
- **Tailwind CSS**: estilos.
- **vite-plugin-pwa**: instalación como app / funcionamiento offline.
- **Recharts**: gráficos de estadísticas.
- **Lucide**: iconografía (nunca emojis como iconos de interfaz).
- **react-router-dom**: navegación entre pantallas.
- **Vitest + Testing Library**: pruebas automáticas.

Sin backend en la v1. Sin cuentas de usuario. Todo el estado vive en el dispositivo.

## Decisiones de arquitectura importantes

- **Separación hábito / registro diario**: la definición de un hábito y sus registros día a día son entidades separadas en la base de datos. Esto permite archivar o eliminar un hábito sin destruir su historial, y es la base para poder agregar sincronización entre dispositivos en el futuro sin rediseñar el modelo.
- **Eliminar ≠ borrar historial**: "Archivar" es reversible y oculta el hábito de la vista diaria. "Eliminar" pide confirmación explícita; por defecto conserva el historial en estadísticas, con una opción aparte (doble confirmación) para borrar todo.
- **Tema (claro/oscuro/sistema)** se guarda en `localStorage` bajo la clave `habitos-tracker-theme`, separado del resto de la configuración (que vive en Dexie). Motivo: se necesita leerlo de forma síncrona antes de que React monte, para evitar un parpadeo del tema incorrecto (hay un script inline en `index.html` que hace esto).
- **Estadísticas con pocos datos**: si un hábito tiene menos de ~7 días de historial, las métricas de tendencia muestran un aviso de "datos insuficientes" en vez de un número que aparente ser concluyente.
- **Recordatorios v1**: son locales (`ReminderWatcher` revisa cada 20s si la hora actual coincide con la hora preferida de algún hábito activo todavía sin registrar hoy, mientras la app está abierta) y se muestran como un aviso descartable dentro de la app, no como notificación del sistema operativo — eso requeriría pedir permiso del navegador y, para funcionar con la app cerrada, un servidor push. Documentado como mejora futura.
- **Sin sincronización entre dispositivos en v1**: cada navegador/dispositivo tiene su copia local. El respaldo/restauración manual (exportar/importar JSON) es el mecanismo de transferencia entre dispositivos por ahora.

## Estructura del proyecto

```
src/
  theme/          Contexto de tema claro/oscuro/sistema
  db/             Modelo de datos (Dexie/IndexedDB) y capa de acceso
    types.ts             Tipos: Habito, RegistroDiario, Categoria, Configuracion
    db.ts                Esquema Dexie, versión 1, siembra inicial
    defaultCategories.ts Categorías sugeridas (editables/eliminables)
    habitsRepo.ts         CRUD de hábitos + pausar/archivar/reactivar/duplicar/eliminar
    logsRepo.ts           Registro diario (upsert, sin duplicados) + consultas
    categoriesRepo.ts     CRUD de categorías (reasigna hábitos al eliminar)
    settingsRepo.ts       Configuración general (no incluye tema, ver arriba)
    hooks.ts              Hooks de lectura reactiva (dexie-react-hooks/useLiveQuery)
    tombstones.ts          Deja constancia local de un borrado permanente, para sincronizar
    resetRepo.ts            "Borrar todos los datos" (vacía y vuelve a sembrar)
    __tests__/            Pruebas automáticas de toda la capa de datos (Vitest)
  utils/date.ts   Utilidades de fecha (formato YYYY-MM-DD, aritmética de fechas compartida por todo el proyecto)
  test/setup.ts   Configuración de pruebas (fake-indexeddb, jest-dom)
  components/     Piezas reutilizables de interfaz
    Layout.tsx, ThemeToggle.tsx, ConfirmDialog.tsx, EmptyState.tsx, IconPicker.tsx, ColorPicker.tsx
  habits/         Pantallas de gestión de hábitos y lógica de cumplimiento diario
    HabitsListPage.tsx    Buscar, filtrar, ordenar, y acciones (pausar/archivar/duplicar/eliminar/reactivar)
    HabitFormPage.tsx     Crear y editar (formulario único, con validación)
    HabitCard.tsx, icons.ts (+ .test.ts), colors.ts, formTypes.ts, validation.ts (+ validation.test.ts)
    HabitTodayCard.tsx    Tarjeta de un hábito en el panel de hoy (marcar/desmarcar, contador, omitir, nota)
    WeeklySummary.tsx     Resumen visual de los últimos 7 días
    dailyStatus.ts (+ .test.ts)  Si un hábito aplica hoy, y si está pendiente/logrado/parcial/excedido/omitido
    streak.ts (+ .test.ts)       Cálculo de racha actual (diaria, días específicos, x veces por semana)
    summary.ts (+ .test.ts)      Resumen de cumplimiento de los últimos N días
  panel/          Panel principal ("Hoy", ruta "/")
    PanelPage.tsx, motivationalQuotes.ts
  calendar/       Calendario mensual (ruta "/calendario")
    CalendarPage.tsx        Grilla del mes, navegación, leyenda, y detalle del día seleccionado
    monthGrid.ts (+ .test.ts)      Fechas a mostrar en la grilla (incluye relleno de meses vecinos)
    dayCellStatus.ts (+ .test.ts)  Color de cada celda (compartido con el mapa de calor de Estadísticas)
  stats/          Estadísticas y gráficos (ruta "/estadisticas")
    StatsPage.tsx           Selector de período + todas las secciones
    period.ts (+ .test.ts)         Cálculo de rangos de fecha (7/30/90 días, año, personalizado) y período anterior
    metrics.ts (+ .test.ts)        Cumplimiento total/por hábito/por categoría/por día de semana, evolución, días perfectos
    PeriodSelector.tsx, HeatmapCalendar.tsx, EvolutionChart.tsx, HabitRankingList.tsx, CategoryBreakdown.tsx, WeekdayBreakdown.tsx
  settings/       Configuración, respaldo y efectos globales (ruta "/configuracion")
    SettingsPage.tsx        Tema, primer día de semana, formato de fecha, animaciones, frases, recordatorios, respaldo, borrado total
    CategoriesPage.tsx      Gestión de categorías: crear, editar y eliminar (ruta "/configuracion/categorias")
    backup.ts (+ .test.ts)  Exportar/validar/restaurar un respaldo completo (JSON)
    AnimationsEffect.tsx    Aplica la clase `.reducir-animaciones` a toda la app según la configuración (no renderiza nada)
    ReminderWatcher.tsx     Recordatorios locales: revisa cada 20s y muestra un aviso descartable
  sync/           Sincronización entre dispositivos (Supabase)
    supabaseClient.ts       Cliente de Supabase (URL + publishable key)
    AuthContext.tsx         Sesión actual de toda la app (`useAuth`)
    SyncContext.tsx         Dispara la sincronización automática y expone su estado (`useSync`)
    SyncSection.tsx         Inicio/cierre de sesión, estado y botón manual (dentro de Configuración → Sincronización)
    mapping.ts (+ .test.ts) Traduce cada tipo de dato entre el formato local y el de Supabase; "última escritura gana"
    syncEngine.ts           El motor en sí: qué se sube, qué se baja, y en qué orden
  onboarding/     Introducción inicial (ruta "/bienvenida")
    OnboardingPage.tsx      Bienvenida + elegir hábitos sugeridos (opcional) o crear el propio
    RequireOnboarding.tsx   Manda a "/bienvenida" si `configuracion.onboardingCompletado` es false
    suggestedHabits.ts (+ .test.ts)  Catálogo de hábitos sugeridos y su conversión a NuevoHabito
public/
  icon.svg              Ícono base (favicon, y fuente para generar el resto)
  icon-192.png, icon-512.png, apple-touch-icon.png   Iconos PWA generados desde icon.svg (ver nota abajo)
```

### Notas del modelo de datos

- Claves de fecha en formato `YYYY-MM-DD` (orden alfabético = orden cronológico, evita ambigüedades de zona horaria).
- `registros` tiene un índice único compuesto `[habitoId+fecha]`: la base de datos misma impide duplicados, además de la lógica de "upsert" en `logsRepo`.
- Un día "pendiente" (sin marcar) simplemente no tiene fila en `registros` — no se guardan filas vacías.
- `eliminarHabito` sin opciones = borrado suave (oculta, conserva historial). `eliminarHabito(id, { borrarHistorial: true })` = borrado permanente e irreversible de hábito + registros.
- El campo `estado` (activo/pausado/archivado) del hábito **no es editable desde el formulario**: se cambia únicamente desde los botones de acción de la lista de gestión (Pausar/Reanudar/Archivar/Reactivar), para evitar dos caminos distintos que lleven a estados inconsistentes.
- Paleta de íconos y colores es una selección curada (no el catálogo completo de Lucide) para mantener el bundle liviano y la elección simple; ver `src/habits/icons.ts` y `colors.ts`. Ampliada después de la v1 a ~94 íconos y 20 colores, con buscador en español (`buscarIconos`, por nombre de ícono o palabras clave tipo "agua", "dinero", "ejercicio"; sin distinguir mayúsculas ni acentos).
- **Gestión de categorías** (`settings/CategoriesPage.tsx`, ruta "/configuracion/categorias", accesible desde un link en Configuración): la capa de datos (`categoriesRepo.ts`) existía desde la Etapa 1, pero no tenía pantalla propia hasta ahora — se agregó para cumplir el pedido original de poder crear/editar/eliminar categorías. Reutiliza `IconPicker` y `ColorPicker` (los mismos del formulario de hábitos) en vez de duplicarlos. Junto a cada categoría se muestra cuántos hábitos la usan (contando activos, pausados y archivados, pero no eliminados); al eliminar una categoría, el aviso de confirmación anticipa ese número y aclara que esos hábitos quedan "sin categoría" (no se borran, ver `eliminarCategoria` en `categoriesRepo.ts`). Las categorías predefinidas también se pueden renombrar/recolorear/eliminar como cualquier otra — no hay ninguna protección especial para ellas.
- **Cumplimiento del día**: un hábito puede estar `pendiente` (sin registro), `logrado`, `parcial` (cantidad/tiempo por debajo de la meta), `excedido` (límite máximo superado) u `omitido`. Un hábito sí/no con `vecesPorDia > 1` se trata internamente como un contador (meta = vecesPorDia), igual que cantidad/tiempo/límite. Ver `src/habits/dailyStatus.ts`.
- **Notas diarias solo sobre un registro existente**: para agregar una nota primero hay que marcar el hábito (completado, contador, u omitido). Evita marcar un día como "hecho" solo por escribir una nota.
- **Incrementar/decrementar contadores** usa `incrementarRegistro` (lee el valor actual desde la base de datos dentro de una transacción), no el valor en pantalla — así varios taps seguidos en +/- se acumulan bien y no se pisan entre sí. Bug real encontrado y corregido durante la Etapa 3.
- **Resumen semanal** = últimos 7 días corridos (hoy y los 6 anteriores), no la semana calendario. Más simple de calcular y de entender; la alineación por semana calendario puede llegar en Estadísticas (Etapa 5) si hace falta.
- La barra de navegación inferior es `fixed` con altura fija (`h-16`); cualquier barra de acciones flotante/`sticky` en el fondo de una pantalla debe dejarle espacio (`bottom-20` o más) para no quedar tapada y recibir clics que en realidad caen sobre la navegación.
- **Calendario**: a diferencia del Panel principal (que solo muestra hábitos con estado "activo"), el Calendario considera *todos* los hábitos no eliminados (activos, pausados y archivados), porque un hábito pausado hoy pudo haber estado vigente en una fecha pasada y su historial sigue siendo válido para revisar/editar. Reutiliza `HabitTodayCard` (Etapa 3) pasándole la fecha elegida en vez de "hoy" — el mismo componente sirve para hoy y para cualquier día pasado, incluida la racha "como si fuera esa fecha".
- El color de una celda del calendario no distingue "omitido" como categoría propia (se ve igual que "sin registros" con 0%); el detalle del día sí lo muestra. Alcanza para la vista mensual y evita una leyenda con demasiados colores.
- **Estadísticas incluye hábitos eliminados** (`incluirEliminados: true`), a diferencia del Calendario (que ya incluye pausados/archivados pero no eliminados). Es la razón de ser del borrado suave: "conservar el historial en estadísticas" (ver Etapa 1). El Panel principal sigue siendo el único que se limita a hábitos `activo`.
- **Umbral de datos suficientes = 7 días aplicables** (`UMBRAL_DATOS_MINIMOS` en `src/stats/metrics.ts`). Por debajo de eso, en vez de un porcentaje se muestra "Datos insuficientes", y conclusiones como "tu mejor día" o la comparación con el período anterior se ocultan en lugar de mostrar un número que podría ser engañoso.
- **"Total de días completados"** se interpretó como días *perfectos* (100% de los hábitos aplicables ese día cumplidos), no como la suma de registros logrados — parecía la lectura más útil de ese número para alguien que no programa.
- La aritmética de fechas (sumar días, contar días entre dos fechas, listar un rango) vive en `src/utils/date.ts` y la reutilizan `habits/summary.ts`, `habits/streak.ts`, `stats/*`; evitar reimplementarla de nuevo en un archivo nuevo.
- **`StatsPage` se carga con `React.lazy`** (ver `App.tsx`): Recharts agrega ~390 KB al bundle, y solo hace falta en Estadísticas. Separarlo en su propio chunk evita que ese peso retrase la carga inicial del Panel/Calendario/Hábitos, que son las pantallas de uso diario. Cualquier otra librería pesada que solo use una pantalla debería seguir el mismo patrón.
- **Alcance de "primer día de la semana" y "formato de fecha"**: por diseño, la app usa fechas en palabras ("martes, 28 de julio") en casi toda la interfaz, no números — así que estas dos configuraciones tienen un efecto visible acotado pero real: "primer día de la semana" cambia el orden de columnas de la grilla del Calendario; "formato de fecha" se ve en la fecha numérica junto al título del día seleccionado en el Calendario. Deliberadamente **no** afectan el cálculo interno de rachas ni la agrupación semanal de Estadísticas (`lunesDeLaSemana` en `streak.ts`), que siempre usa lunes como convención interna — cambiar esa base habría sido un refactor de alto riesgo para las pruebas ya validadas, sin un beneficio claro para el usuario.
- **Respaldo (exportar/importar)**: `src/settings/backup.ts` arma/valida/restaura un JSON versionado (`{ version, exportadoEn, habitos, registros, categorias, configuracion }`). Al importar, primero se descarga automáticamente una copia de seguridad de los datos actuales (por si el archivo importado resulta un error), y recién después se reemplaza todo. La validación es manual (sin librería externa) pero verifica la forma de cada registro antes de tocar la base de datos.
- **"Borrar todos los datos"** vacía las 4 tablas y vuelve a sembrar las categorías predefinidas y la configuración por defecto (`db/resetRepo.ts`), para no dejar la app en un estado roto (sin categorías) después del borrado.
- **Onboarding**: se muestra según `configuracion.onboardingCompletado` (no según si hay 0 hábitos), para no reaparecer si el usuario borra todos sus hábitos más adelante. `obtenerConfiguracion()` combina lo guardado con los valores por defecto (`{ ...CONFIGURACION_POR_DEFECTO, ...config }`), así que si se agrega un campo nuevo a `Configuracion` en el futuro, las configuraciones guardadas antes de ese cambio no se rompen ni faltan datos — aplica el mismo criterio al restaurar un respaldo viejo en `backup.ts`.
- Los hábitos sugeridos del onboarding **no se crean solos**: se listan con checkbox y recién se guardan si el usuario elige alguno y confirma. Una prueba automática (`suggestedHabits.test.ts`) verifica que cada ícono y categoría sugeridos existan de verdad en los catálogos reales, para detectar un nombre mal escrito antes de que llegue a producción.
- **Bug de contraste encontrado en la Etapa 7** (y corregido para toda la app): la paleta `brand` en `tailwind.config.js` no tenía el tono `950`, así que todo lo que usaba `dark:bg-brand-950` (varias selecciones marcadas en formularios) caía silenciosamente al `bg-brand-50` claro en tema oscuro — texto claro sobre fondo claro, casi ilegible. Estaba así desde la Etapa 2 sin haberlo notado visualmente. Se agregó el tono faltante (`950: '#1e1b4b'`) al config, que corrige los ~8 lugares afectados de una sola vez. Lección: los pasos de "probar en el navegador" deben incluir mirar los estados *seleccionados/activos* de los controles, no solo el estado inicial.
- **Iconos PWA** (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) se generaron una sola vez, en la Etapa 8, rasterizando `public/icon.svg` con la librería `sharp` (instalada temporalmente con `npm install --no-save sharp`, usada, y desinstalada — no queda como dependencia del proyecto). El diseño del ícono (cuadrado redondeado + tilde, sin texto pegado a los bordes) ya cumple la "zona segura" que piden los íconos *maskable*, así que las mismas imágenes se usan para los dos propósitos (`any` y `maskable`) en el manifest. Si se cambia el ícono en el futuro, hay que repetir este proceso para regenerar los PNG — no se actualizan solos a partir del SVG.
- **`vercel.json`**: la app usa `react-router-dom` con `BrowserRouter` (rutas como `/calendario`, `/estadisticas` sin `#`). Sin una regla de reescritura, un hosting estático como Vercel devuelve 404 al entrar directo a esas direcciones (por ejemplo al recargar la página o instalar la PWA en una subpágina), porque busca un archivo real con ese nombre. La regla `{ "source": "/(.*)", "destination": "/index.html" }` hace que cualquier ruta sirva `index.html` y sea React Router quien decida qué mostrar — los archivos reales (JS, CSS, íconos, `manifest.webmanifest`) se siguen sirviendo directo, sin pasar por esta regla. Bug real encontrado recién al publicar la app en la Etapa 8; no se detecta probando solo con `npm run dev`, porque el servidor de desarrollo de Vite ya hace este mismo "fallback" automáticamente.
- **UUID estable como llave de sincronización (Sync A, base de la sincronización entre dispositivos)**: `Habito`, `RegistroDiario` y `Categoria` ahora tienen un campo `uuid` (además del `id` autoincremental local de Dexie, que sigue existiendo pero ya no alcanza como identidad entre dispositivos: dos teléfonos generan sus propios ids empezando en 1). El `uuid` se genera con `crypto.randomUUID()` una sola vez, al crear cada fila (`crearHabito`, `registrarCumplimiento`/`incrementarRegistro`, `crearCategoria`), y nunca cambia — es la llave que usará el motor de sincronización para saber "esto es lo mismo" en dos dispositivos distintos. Las 11 categorías predefinidas (`defaultCategories.ts`) usan uuids fijos y hardcodeados (no aleatorios) para que dos dispositivos que sembraron su base *antes* del primer login no terminen con "Salud" duplicada al sincronizar.
- **Migración a Dexie `version(2)`** (`db/db.ts`): agrega `uuid` a los índices de las 3 tablas y trae un `.upgrade()` que le asigna un uuid nuevo a cualquier fila existente que no lo tenga. Probado con un caso real: una base "vieja" (solo `version(1)`, sin campo `uuid`, construida a mano con Dexie crudo en la prueba automática) se reabre con la versión actual de la app y termina con uuids válidos sin perder datos. Además verificado en el navegador real (no solo en la prueba con `fake-indexeddb`): los hábitos que ya existían en la base de datos de desarrollo desde antes de este cambio aparecen con `uuid` después de recargar la app, sin errores de consola.
- **Compatibilidad de respaldos viejos con `uuid`** (`settings/backup.ts`): un archivo de respaldo exportado *antes* de que existiera este campo se sigue aceptando al importar (`validarRespaldo` no exige `uuid`); al restaurarlo, `conUuid()` le asigna uno nuevo a cada fila que no lo traiga. Así un respaldo descargado hoy mismo por el usuario sigue sirviendo después de esta actualización.
- **Esquema en Supabase (Sync B)**: 3 tablas (`habitos`, `registros`, `categorias`) en el proyecto de Supabase del usuario, con RLS (Row Level Security) activado — cada fila tiene un `user_id` y una política que solo deja ver/tocar las propias. La seguridad la aplica la base de datos misma, no el código de la app. Cada tabla usa el `uuid` (no el id local) como clave primaria. Para `habitos`/`registros`, el cliente manda su propio `updated_at` (necesario para que el "last-write-wins" del motor de sincronización compare el momento real de la edición, no cuándo llegó al servidor); para `categorias` —que cambian poco— el servidor le pone la fecha con un trigger, una simplificación consciente ya que el riesgo de conflicto ahí es bajo. El SQL para crear esto lo corrió el usuario mismo en el SQL Editor de Supabase (no se usó ni se pidió la clave secreta `service_role`).
- **Inicio de sesión con link mágico (Sync C)**: `src/sync/supabaseClient.ts` crea el cliente de Supabase con la URL del proyecto y la "publishable key" (pensada para exponerse en el cliente; la seguridad real la da RLS, no ocultar esta clave — por eso está directamente en el código en vez de una variable de entorno, y así se evita que el usuario tenga que configurar variables de entorno en Vercel). `src/sync/AuthContext.tsx` expone la sesión actual a toda la app (`useAuth()`); `src/sync/SyncSection.tsx` es la pantalla en Configuración → Sincronización: sin sesión, pide el correo y llama a `signInWithOtp` (sin contraseña); con sesión, muestra el correo y un botón para cerrarla. Iniciar sesión (o no) no afecta en nada el uso local de la app. Para que el link del correo funcione hay que agregar las direcciones de la app (`http://localhost:5173` y el dominio de Vercel) en Supabase → Authentication → URL Configuration → Redirect URLs. El mensaje de error al pedir el link muestra el texto real de Supabase (no uno genérico) — se decidió así después de un caso real: el servicio de correo gratuito que trae Supabase por defecto (sin configurar un SMTP propio) tiene un límite muy bajo de envíos por hora, y sin ver el error real ("email rate limit exceeded") hubiera sido difícil de diagnosticar a distancia. Si esto se vuelve un problema recurrente (más de 2-3 inicios de sesión por hora entre los dos usuarios), la solución es configurar un proveedor SMTP propio en Supabase (hay opciones gratuitas); no hecho todavía porque el uso esperado es esporádico.
- **Motor de sincronización (Sync D)** (`src/sync/syncEngine.ts`): si hay sesión iniciada, sube y baja cambios de `habitos`, `registros` y `categorias` contra Supabase. Se dispara al iniciar sesión, cada 60 segundos mientras la app está abierta (`src/sync/SyncContext.tsx`, patrón similar a `ReminderWatcher`), y al volver a estar visible/online la pestaña. Guarda en `localStorage` (no en Dexie: es información del dispositivo, no de la app, mismo criterio que el tema) la fecha de la última sincronización exitosa (`habitos-tracker-ultima-sync`) — cada sincronización solo pide lo que cambió desde ahí ("incremental"), no todo de nuevo.
  - **"Última escritura gana"**: al bajar (pull) un hábito o registro que también existe localmente, se compara `updatedAt` (el momento real de la edición, generado en el dispositivo donde se editó) y gana el más reciente — no importa a qué hora llegó al servidor. Ver `remotoEsMasNuevo` en `src/sync/mapping.ts`.
  - **Borrados permanentes ("tombstones")**: como Supabase no guarda un registro de "esto se borró" por sí solo, cada vez que el código borra una fila para siempre (desmarcar un día → `quitarRegistro`, bajar un contador a 0 → `incrementarRegistro`, "eliminar con borrar historial" → `eliminarHabito`, eliminar una categoría → `eliminarCategoria`, o "Borrar todos los datos" → `eliminarTodosLosDatos`) deja constancia en una tabla local nueva, `eliminaciones` (`db/tombstones.ts`, Dexie `version(3)`). El motor sube esas constancias a una tabla remota `tombstones` (SQL aparte, ver más abajo) antes de subir cualquier otro cambio, y al bajar cambios primero borra localmente lo que otros dispositivos marcaron como borrado, antes de bajar el resto — en ambos sentidos, en ese orden, para que un hábito recién borrado (o una categoría predefinida "reseteada" por Borrar todos los datos) no reaparezca por accidente. Sin esto, desmarcar un hábito en el teléfono no se reflejaría en la tablet.
  - **Categorías se suben completas en cada sincronización** (no solo las que cambiaron): son pocas (decenas, no miles) y no tienen `updatedAt` local (a diferencia de hábitos y registros), así que llevar ese rastro no valía la complejidad extra.
  - **Un dispositivo, una cuenta**: si dos personas comparten el mismo navegador (ej. la misma computadora), sincronizar con una segunda cuenta de Supabase después de haber sincronizado con la primera se bloquea con un error explícito (`verificarMismaCuenta` en `syncEngine.ts`), en vez de mezclar los datos de las dos personas — export/import de la Zona de riesgo es la forma correcta de "vaciar" un dispositivo antes de usarlo con otra cuenta. Por eso se recomienda una cuenta de Supabase por persona, cada una en su propio teléfono.
  - **Límite conocido y documentado**: "Importar datos" (restaurar un respaldo `.json`) *no* deja constancia de lo que reemplaza, así que si se usa con la sincronización activa, los datos viejos podrían no borrarse en los demás dispositivos. Se avisa esto mismo en el diálogo de confirmación de Importar cuando hay sesión iniciada. "Borrar todos los datos" sí quedó bien resuelto (deja constancia de todo antes de borrar).
  - Tabla adicional en Supabase para esto (`tombstones`, con RLS igual que las otras 3): el usuario la corrió en su SQL Editor.
  - Probado: `src/sync/mapping.test.ts` (ida y vuelta de cada tipo de dato, y quién gana en un conflicto) y pruebas nuevas en `habitsRepo.test.ts`/`logsRepo.test.ts`/`categoriesRepo.test.ts` (qué queda registrado en `eliminaciones` al borrar). Verificado también en el navegador contra la base de datos real: marcar y desmarcar un hábito deja exactamente la constancia esperada en `eliminaciones`.
  - **Bug real encontrado en la verificación con dos dispositivos (tablet + teléfono)**: el cursor "qué cambió desde la última vez" (`habitos-tracker-ultima-sync`) se guardaba con la hora exacta en que arrancaba cada sincronización. Sincronizando varias veces seguidas desde dos dispositivos (como al probarlo), un dispositivo podía guardar un cursor más nuevo que el momento en que otro dispositivo recién estaba subiendo un borrado (ej. desmarcar un hábito) — y como el cursor nunca "retrocede", ese cambio quedaba salteado para siempre, sin ningún error visible. Arreglado con un margen de seguridad de 2 minutos al guardar el cursor (`MARGEN_SEGURO_MS` en `syncEngine.ts`): es inofensivo repetir un poco de trabajo (subir/bajar lo mismo dos veces no rompe nada gracias a que todo es upsert/borrar-si-existe), pero si nunca "sobrara" margen un cambio real podía perderse silenciosamente. Además, como este margen no corrige un cursor que ya había quedado adelantado *antes* del arreglo, se agregó un botón "Forzar sincronización completa" (`reiniciarCursorSync`) en Configuración → Sincronización, que vuelve a comparar todo desde cero — pensado tanto para resolver este caso puntual como para cualquier futuro "no se actualizó" sin tener que investigar la causa a distancia.

## Reglas de trabajo

- Etapas pequeñas; cada una se verifica corriendo la app antes de pasar a la siguiente.
- No dejar botones sin función ni datos simulados permanentes.
- No cambiar funcionalidad ya aprobada sin explicar antes el motivo.
- Commit de Git al cerrar cada etapa.
- Explicar cualquier término técnico nuevo en el chat con el usuario.

## Estado del proyecto

- [x] Etapa 0 — Estructura base, Git, PWA base, tema claro/oscuro/sistema
- [x] Etapa 1 — Modelo de datos y almacenamiento local (18/18 pruebas automáticas pasando)
- [x] Etapa 2 — CRUD de hábitos (29/29 pruebas automáticas pasando, probado en navegador)
- [x] Etapa 3 — Panel principal y registro diario (53/53 pruebas automáticas pasando, probado en navegador)
- [x] Etapa 4 — Calendario mensual (66/66 pruebas automáticas pasando, probado en navegador)
- [x] Etapa 5 — Estadísticas y gráficos (88/88 pruebas automáticas pasando, probado en navegador)
- [x] Etapa 6 — Configuración, exportar/importar (95/95 pruebas automáticas pasando, probado en navegador)
- [x] Etapa 7 — Onboarding inicial (99/99 pruebas automáticas pasando, probado en navegador)
- [x] Etapa 8 — Pulido, accesibilidad, PWA instalable, pruebas finales (99/99 pruebas automáticas pasando, probado en navegador)
- [x] **Publicada online**: https://habits-tracker-wheat.vercel.app (GitHub + Vercel, se actualiza sola con cada `git push` a `main`). Instalada y probada en un Android real: PWA, crear/marcar hábitos, y exportar → importar de punta a punta, todo verificado en el dispositivo del usuario.
- [x] **Más íconos y colores**: catálogo ampliado a ~94 íconos y 20 colores, con buscador en español (`buscarIconos`).
- [x] **Gestión de categorías**: pantalla dedicada para crear, editar y eliminar categorías (`settings/CategoriesPage.tsx`, desde Configuración), verificada en navegador (crear, editar, y eliminar con reasignación de hábitos, sin errores de consola).
- [x] **Sincronización entre dispositivos**, con Supabase (plan gratuito, sin costo): Sync A (uuid estable), Sync B (esquema Postgres + RLS), Sync C (inicio de sesión con link mágico), Sync D (motor de sincronización: push/pull, última escritura gana, borrados permanentes vía tombstones), Sync E (verificado de punta a punta en dispositivos reales del usuario — tablet Android + teléfono Android, misma cuenta: hábitos, marcar/desmarcar y borrados se reflejan correctamente entre los dos). En el camino se encontró y corrigió un bug real de sincronización muy seguida entre dos dispositivos (carrera del cursor, ver más abajo) — quedó además un botón "Forzar sincronización completa" como herramienta permanente para cualquier caso futuro de "no se actualizó".

## Pendientes / mejoras futuras documentadas (fuera de alcance v1)

- Notificaciones push reales (requeriría backend) — deliberadamente después de terminar la sincronización.
- Registro/login de usuario, pagos, funciones sociales, IA/chat, integraciones con wearables — explícitamente fuera de alcance por pedido del usuario.
- "Revisar historial" de un hábito desde la lista de gestión: resuelto de forma natural al existir el Calendario (Etapa 4) y las Estadísticas (Etapa 5); no hay un botón dedicado "ver historial" en cada hábito de la lista de gestión, pero cualquier hábito se puede revisar desde esas dos pantallas.
- **Bug real encontrado al publicar en un Android real** (no aparece en `npm run dev` ni en las pruebas automáticas): si la app queda abierta en más de un lugar a la vez en el mismo dispositivo (ej. la pestaña de Chrome usada para instalarla + el ícono de la PWA ya instalada), una operación de guardado puede quedar colgada en "Guardando…" y trabar el resto de la app en "Cargando…" — es un comportamiento conocido de IndexedDB cuando hay más de una conexión abierta al mismo tiempo. Se resuelve cerrando todas las instancias y dejando abierta una sola. No se encontró una causa a nivel de código (no se reprodujo en las pruebas automáticas ni en el navegador de escritorio); documentado acá por si vuelve a aparecer.
- Exportar → importar se probó de punta a punta en un Android real (además de las 5 pruebas automáticas de `backup.test.ts`): funciona correctamente.
