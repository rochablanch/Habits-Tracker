import { useEffect, useRef } from 'react'

interface TextPromptDialogProps {
  open: boolean
  title: string
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function TextPromptDialog({
  open,
  title,
  label,
  placeholder,
  value,
  onChange,
  confirmLabel,
  onConfirm,
  onCancel,
}: TextPromptDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-prompt-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
      >
        <h2 id="text-prompt-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="text-prompt-input">
          {label}
        </label>
        <textarea
          id="text-prompt-input"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={300}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
