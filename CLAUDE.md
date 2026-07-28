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
    __tests__/            Pruebas automáticas de toda la capa de datos (Vitest)
  utils/date.ts   Utilidades de fecha (formato YYYY-MM-DD como clave interna)
  test/setup.ts   Configuración de pruebas (fake-indexeddb, jest-dom)
  (a completar en próximas etapas: habits/, calendar/, stats/, settings/, onboarding/)
public/
  icon.svg        Ícono base de la app (pendiente set completo de iconos PWA en Etapa 8)
```

### Notas del modelo de datos

- Claves de fecha en formato `YYYY-MM-DD` (orden alfabético = orden cronológico, evita ambigüedades de zona horaria).
- `registros` tiene un índice único compuesto `[habitoId+fecha]`: la base de datos misma impide duplicados, además de la lógica de "upsert" en `logsRepo`.
- Un día "pendiente" (sin marcar) simplemente no tiene fila en `registros` — no se guardan filas vacías.
- `eliminarHabito` sin opciones = borrado suave (oculta, conserva historial). `eliminarHabito(id, { borrarHistorial: true })` = borrado permanente e irreversible de hábito + registros.

## Reglas de trabajo

- Etapas pequeñas; cada una se verifica corriendo la app antes de pasar a la siguiente.
- No dejar botones sin función ni datos simulados permanentes.
- No cambiar funcionalidad ya aprobada sin explicar antes el motivo.
- Commit de Git al cerrar cada etapa.
- Explicar cualquier término técnico nuevo en el chat con el usuario.

## Estado del proyecto

- [x] Etapa 0 — Estructura base, Git, PWA base, tema claro/oscuro/sistema
- [x] Etapa 1 — Modelo de datos y almacenamiento local (18/18 pruebas automáticas pasando)
- [ ] Etapa 2 — CRUD de hábitos
- [ ] Etapa 3 — Panel principal y registro diario
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
