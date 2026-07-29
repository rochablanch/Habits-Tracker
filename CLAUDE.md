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
- **Recordatorios v1**: son locales (comparando hora actual vs. hora preferida mientras la app está abierta/instalada), no notificaciones push reales, porque push requeriría un servidor. Documentado como mejora futura.
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
  utils/date.ts   Utilidades de fecha (formato YYYY-MM-DD como clave interna)
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
  (a completar en próximas etapas: calendar/, stats/, settings/, onboarding/)
public/
  icon.svg        Ícono base de la app (pendiente set completo de iconos PWA en Etapa 8)
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
- [ ] Etapa 4 — Calendario mensual
- [ ] Etapa 5 — Estadísticas y gráficos
- [ ] Etapa 6 — Configuración, exportar/importar
- [ ] Etapa 7 — Onboarding inicial
- [ ] Etapa 8 — Pulido, accesibilidad, PWA instalable, publicación online

## Pendientes / mejoras futuras documentadas (fuera de alcance v1)

- Sincronización entre dispositivos (requeriría backend + autenticación).
- Notificaciones push reales (requeriría backend).
- Registro/login de usuario, pagos, funciones sociales, IA/chat, integraciones con wearables — explícitamente fuera de alcance por pedido del usuario.
- Set completo de iconos PWA (varios tamaños PNG + maskable) — hoy usa un único SVG placeholder.
- "Revisar historial" de un hábito desde la lista de gestión: se resuelve naturalmente cuando existan el Calendario (Etapa 4) y las Estadísticas (Etapa 5); no se agregó un botón propio en la Etapa 2 para evitar un enlace a una pantalla que todavía no existe.
