const FRASES = [
  'Un pequeño paso hoy es progreso real.',
  'La constancia le gana a la intensidad.',
  'No tenés que ser perfecto, solo constante.',
  'Cada día cuenta, incluso los días simples.',
  'Lo que se repite, se vuelve parte de vos.',
  'Avanzar un poco es mejor que no avanzar nada.',
  'Tu yo de mañana te va a agradecer el de hoy.',
  'Las rachas se construyen un día a la vez.',
  'Progreso, no perfección.',
  'Hoy también cuenta.',
  'Pequeños hábitos, grandes cambios.',
  'Empezar ya es la mitad del camino.',
  'La disciplina es elegir entre lo que querés ahora y lo que querés más.',
  'No se trata de tener tiempo, se trata de hacer tiempo.',
  'Cada repetición te acerca a quien querés ser.',
]

/** Selección determinística por fecha: la misma frase se muestra todo el día, sin importar cuántas veces se recargue. */
export function fraseDelDia(fecha: string): string {
  let hash = 0
  for (let i = 0; i < fecha.length; i++) {
    hash = (hash * 31 + fecha.charCodeAt(i)) % FRASES.length
  }
  return FRASES[Math.abs(hash) % FRASES.length]
}
