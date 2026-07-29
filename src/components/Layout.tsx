import { CalendarCheck, CalendarDays, ListChecks } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const NAV_CLASE = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
    isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
  }`

export function Layout() {
  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-7 w-7 rounded-lg" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Hábitos</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 h-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex h-full max-w-2xl">
          <NavLink to="/" end className={NAV_CLASE}>
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            Hoy
          </NavLink>
          <NavLink to="/calendario" className={NAV_CLASE}>
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            Calendario
          </NavLink>
          <NavLink to="/habitos" className={NAV_CLASE}>
            <ListChecks className="h-5 w-5" aria-hidden="true" />
            Hábitos
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
