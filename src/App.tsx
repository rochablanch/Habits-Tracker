import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HabitFormPage } from './habits/HabitFormPage'
import { HabitsListPage } from './habits/HabitsListPage'
import { PanelPage } from './panel/PanelPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PanelPage />} />
          <Route path="/habitos" element={<HabitsListPage />} />
          <Route path="/habitos/nuevo" element={<HabitFormPage />} />
          <Route path="/habitos/:id/editar" element={<HabitFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
