import { toISODate } from '../utils/date'

/** Suma (o resta, con n negativo) meses a un "YYYY-MM", devuelve "YYYY-MM". */
export function sumarMeses(anioMes: string, n: number): string {
  const [anio, mes] = anioMes.split('-').map(Number)
  const d = new Date(anio, mes - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function anioMesDeFecha(fecha: string): string {
  return fecha.slice(0, 7)
}

/**
 * Fechas (YYYY-MM-DD) a mostrar en la grilla del mes: el mes completo más los
 * días de relleno de las semanas incompletas al principio y al final, para
 * que la grilla empiece siempre el mismo día de la semana.
 */
export function diasDelMesVisible(anioMes: string, primerDiaSemana: 0 | 1 = 1): string[] {
  const [anio, mes] = anioMes.split('-').map(Number)
  const primerDiaMes = new Date(anio, mes - 1, 1)
  const ultimoDiaMes = new Date(anio, mes, 0)

  const diaSemanaInicio = primerDiaMes.getDay()
  const offsetInicio =
    primerDiaSemana === 1 ? (diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1) : diaSemanaInicio
  const inicio = new Date(primerDiaMes)
  inicio.setDate(inicio.getDate() - offsetInicio)

  const diaSemanaFin = ultimoDiaMes.getDay()
  const offsetFin = primerDiaSemana === 1 ? (diaSemanaFin === 0 ? 0 : 7 - diaSemanaFin) : 6 - diaSemanaFin
  const fin = new Date(ultimoDiaMes)
  fin.setDate(fin.getDate() + offsetFin)

  const dias: string[] = []
  const cursor = new Date(inicio)
  while (cursor <= fin) {
    dias.push(toISODate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dias
}
