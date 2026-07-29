import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CalendarPage } from './calendar/CalendarPage'
import { Layout } from './components/Layout'
import { HabitFormPage } from './habits/HabitFormPage'
import { HabitsListPage } from './habits/HabitsListPage'
import { PanelPage } from './panel/PanelPage'

// Se carga aparte (code splitting): trae Recharts, una librería pesada que solo hace falta acá.
const StatsPage = lazy(() => import('./stats/StatsPage').then((m) => ({ default: m.StatsPage })))

function CargandoPagina() {
  return <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PanelPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route
            path="/estadisticas"
            element={
              <Suspense fallback={<CargandoPagina />}>
                <StatsPage />
              </Suspense>
            }
          />
          <Route path="/habitos" element={<HabitsListPage />} />
          <Route path="/habitos/nuevo" element={<HabitFormPage />} />
          <Route path="/habitos/:id/editar" element={<HabitFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
