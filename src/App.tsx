import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HabitFormPage } from './habits/HabitFormPage'
import { HabitsListPage } from './habits/HabitsListPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* La pantalla de inicio real (Panel principal) se construye en la Etapa 3. Por ahora, "/" muestra la gestión de hábitos. */}
          <Route path="/" element={<Navigate to="/habitos" replace />} />
          <Route path="/habitos" element={<HabitsListPage />} />
          <Route path="/habitos/nuevo" element={<HabitFormPage />} />
          <Route path="/habitos/:id/editar" element={<HabitFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
