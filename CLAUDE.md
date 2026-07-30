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
    __tests__/            Pruebas automáticas de toda la capa de datos (Vitest)
  utils/date.ts   Utilidades de fecha (formato YYYY-MM-DD, aritmética de fechas compartida por todo el proyecto)
  test/setup.ts   Configuración de pruebas (fake-indexeddb, jest-dom)
  components/     Piezas reutilizables de interfaz
    Layout.tsx, ThemeToggle.tsx, ConfirmDialog.tsx, EmptyState.tsx, IconPicker.tsx, ColorPicker.tsx
  habits/         Pantallas de gestión de hábitos y lógica de cumplimiento diario
    HabitsListPage.tsx    Buscar, filtrar, ordenar, y acciones (pausar/archivar/duplicar/eliminar/reactivar)
    HabitFormPage.tsx     Crear y editar (formulario único, con validación)
    HabitCard.tsx, icons.ts, colors.ts, formTypes.ts, validation.ts (+ validation.test.ts)
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
    backup.ts (+ .test.ts)  Exportar/validar/restaurar un respaldo completo (JSON)
    AnimationsEffect.tsx    Aplica la clase `.reducir-animaciones` a toda la app según la configuración (no renderiza nada)
    ReminderWatcher.tsx     Recordatorios locales: revisa cada 20s y muestra un aviso descartable
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
- Paleta de íconos y colores es una selección curada (no el catálogo completo de Lucide) para mantener el bundle liviano y la elección simple; ver `src/habits/icons.ts` y `colors.ts`.
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
- [x] Etapa 8 — Pulido, accesibilidad, PWA instalable, pruebas finales (99/99 pruebas automáticas pasando, probado en navegador; publicación online pendiente de que el usuario cree las cuentas de GitHub/Vercel)

## Pendientes / mejoras futuras documentadas (fuera de alcance v1)

- Sincronización entre dispositivos (requeriría backend + autenticación).
- Notificaciones push reales (requeriría backend).
- Registro/login de usuario, pagos, funciones sociales, IA/chat, integraciones con wearables — explícitamente fuera de alcance por pedido del usuario.
- "Revisar historial" de un hábito desde la lista de gestión: resuelto de forma natural al existir el Calendario (Etapa 4) y las Estadísticas (Etapa 5); no hay un botón dedicado "ver historial" en cada hábito de la lista de gestión, pero cualquier hábito se puede revisar desde esas dos pantallas.
- Limitación conocida de las pruebas: la importación de un archivo (`Configuración → Importar datos`) no se pudo probar de punta a punta en el navegador automatizado porque no hay forma de simular la selección de un archivo real desde las herramientas de este entorno. La lógica de validación y restauración sí está cubierta por 5 pruebas automáticas (`backup.test.ts`), y la exportación (que genera el archivo) sí se verificó en el navegador.
