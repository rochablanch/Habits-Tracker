# Hábitos

Aplicación personal para registrar y seguir hábitos diarios. Funciona en la computadora y en el celular, guarda todo en tu propio dispositivo (no necesita internet para usarse) y se puede instalar como una app.

Esta guía está escrita para alguien sin conocimientos de programación. Cada comando que aparece abajo se escribe en una terminal (en Windows: PowerShell) dentro de la carpeta del proyecto — los bloques de código de este documento se pueden copiar y pegar directo.

## Abrir la aplicación en tu computadora

### Requisitos (una sola vez)

Tener [Node.js](https://nodejs.org) instalado (versión 18 o superior). Es el programa que permite ejecutar esta aplicación en tu computadora.

### Pasos

1. Abrí una terminal en la carpeta del proyecto.
2. La primera vez (y cada vez que se actualice el proyecto), instalá las piezas que usa la app:

```bash
npm install
```

3. Iniciá la aplicación:

```bash
npm run dev
```

4. La terminal va a mostrar una dirección como `http://localhost:5173`. Abrila en tu navegador (Chrome, Edge, etc.).
5. Para detener la aplicación, volvé a la terminal y presioná `Ctrl + C`.

Esta forma sirve para usar la app en tu computadora o para probar cambios. Para poder instalarla en el **celular**, primero hay que publicarla en internet (ver la sección siguiente) — un celular no puede "instalar" una carpeta de tu computadora.

## Publicar la app online (para poder instalarla en el celular)

Se puede hacer gratis, en unos 10 minutos, sin escribir código. Recomiendo **Vercel** porque se conecta directo con GitHub y actualiza la app sola cada vez que guardes cambios.

1. **Crear el repositorio en GitHub** (si todavía no lo hiciste): entrá a [github.com](https://github.com), creá una cuenta gratuita si no tenés, y creá un repositorio nuevo (botón "New repository"). Puede ser privado. No marques ninguna casilla de "inicializar con README" (este proyecto ya tiene uno).
2. Copiá la dirección del repositorio que te muestra GitHub (algo como `https://github.com/tu-usuario/habitos.git`) y pasámela — yo me encargo de subir el código con `git push`.
3. **Crear la cuenta en Vercel**: entrá a [vercel.com](https://vercel.com) y elegí "Continuar con GitHub" para crear la cuenta usando tu mismo usuario de GitHub.
4. Dentro de Vercel, elegí **"Add New" → "Project"**, y seleccioná el repositorio que acabás de crear.
5. Vercel detecta automáticamente que es un proyecto Vite/React; no hace falta cambiar ninguna opción. Tocá **"Deploy"**.
6. En un par de minutos te da una dirección propia (algo como `https://habitos-tuusuario.vercel.app`). Esa es la dirección que vas a abrir desde el celular.

De ahí en más, cualquier cambio que se suba al repositorio de GitHub se publica solo, sin que tengas que hacer nada en Vercel de nuevo.

## Instalarla como app en el celular

Una vez que tengas la dirección publicada (ver arriba):

**Android (Chrome):**
1. Abrí la dirección en Chrome.
2. Tocá el menú (⋮, arriba a la derecha) → **"Instalar app"** (o "Agregar a pantalla de inicio").
3. Confirmá. Va a aparecer un ícono de la app en tu pantalla de inicio, como cualquier otra app.

**iPhone (Safari):**
1. Abrí la dirección en Safari (tiene que ser Safari, no Chrome, para que funcione la instalación en iPhone).
2. Tocá el botón de compartir (el cuadrado con la flecha hacia arriba).
3. Elegí **"Agregar a pantalla de inicio"**.
4. Confirmá. Va a aparecer un ícono de la app en tu pantalla de inicio.

Una vez instalada, funciona sin conexión a internet (salvo la primera vez que la abrís).

## Hacer una copia de seguridad de tus datos

Dentro de la app, andá a **Configuración → Exportar datos**. Se va a descargar un archivo con todos tus hábitos y registros. Guardalo en un lugar seguro (por ejemplo, en tu Google Drive o correo) — es tu única copia fuera del dispositivo.

Para restaurar una copia: **Configuración → Importar datos** y seleccioná el archivo. Antes de reemplazar nada, la app descarga automáticamente una copia de seguridad de lo que tenías, por si el archivo importado resulta un error.

Conviene exportar una copia de vez en cuando (por ejemplo, una vez al mes), y especialmente antes de cambiar de celular o computadora.

## Actualizar la aplicación

Si en el futuro se agregan cambios al proyecto, para aplicarlos en tu computadora:

```bash
git pull
npm install
```

Si la app está publicada en Vercel (ver arriba), se actualiza sola — no hace falta hacer nada ahí.

## ¿Dónde están mis datos?

Tus hábitos y registros se guardan **dentro del navegador**, en tu propio dispositivo (tecnología llamada IndexedDB). Esto significa:

- No se suben a ningún servidor ni se comparten con nadie.
- No se comparten entre dispositivos automáticamente: el celular y la computadora tienen copias separadas. Para pasar tus datos de uno a otro, usá exportar/importar (ver arriba).
- Si borrás los datos del navegador (caché/datos del sitio) sin haber exportado antes, se pierden. Por eso conviene exportar una copia de seguridad de vez en cuando.

## Ejecutar las pruebas automáticas

Para verificar que todo funcione correctamente:

```bash
npm test
```

## Más información

Ver [CLAUDE.md](./CLAUDE.md) para las decisiones técnicas del proyecto, la estructura de carpetas, y las tareas pendientes.
