# Hábitos

Aplicación personal para registrar y seguir hábitos diarios. Funciona en la computadora y en el celular, guarda todo en tu propio dispositivo (no necesita internet para usarse) y se puede instalar como una app.

Esta guía está escrita para alguien sin conocimientos de programación. Cada comando que aparece abajo se escribe en una terminal (en Windows: PowerShell) dentro de la carpeta del proyecto.

## Requisitos (una sola vez)

- Tener [Node.js](https://nodejs.org) instalado (versión 18 o superior). Es el programa que permite ejecutar esta aplicación en tu computadora.

## Iniciar la aplicación en tu computadora

1. Abrí una terminal en la carpeta del proyecto.
2. La primera vez, instalá las piezas que usa la app:

```bash
npm install
```

3. Iniciá la aplicación:

```bash
npm run dev
```

4. La terminal va a mostrar una dirección como `http://localhost:5173`. Abrila en tu navegador (Chrome, Edge, etc.).
5. Para detener la aplicación, volvé a la terminal y presioná `Ctrl + C`.

## Instalarla como app en el celular

*(Estas instrucciones se completan en la Etapa 8, cuando la app esté publicada online.)*

## Hacer una copia de seguridad de tus datos

Dentro de la app, andá a **Configuración → Exportar datos**. Se va a descargar un archivo con todos tus hábitos y registros. Guardalo en un lugar seguro (por ejemplo, en tu Google Drive o correo).

Para restaurar una copia: **Configuración → Importar datos** y seleccioná el archivo. La app hace un respaldo automático de lo que tenías antes de reemplazarlo, por seguridad.

## Actualizar la aplicación

Si en el futuro se agregan cambios al proyecto, para aplicarlos:

```bash
git pull
npm install
```

## ¿Dónde están mis datos?

Tus hábitos y registros se guardan **dentro del navegador**, en tu propio dispositivo (tecnología llamada IndexedDB). Esto significa:

- No se suben a ningún servidor.
- No se comparten entre dispositivos automáticamente (por ejemplo, el celular y la computadora tienen copias separadas).
- Si borrás los datos del navegador (caché/datos del sitio) sin haber exportado antes, se pierden. Por eso conviene exportar una copia de seguridad de vez en cuando.

## Estructura del proyecto (para referencia)

```
src/
  theme/        Tema claro/oscuro/sistema
  ...           (se irá completando en cada etapa)
public/
  icon.svg      Ícono de la aplicación
```

Ver [CLAUDE.md](./CLAUDE.md) para las decisiones técnicas del proyecto y las tareas pendientes.
