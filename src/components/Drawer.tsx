import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { consumeTrigger } from '../lib/focus'

type Props = {
  onClose: () => void
  children: ReactNode
  label: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Drawer({ onClose, children, label }: Props) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Respect an autoFocus field inside the panel; otherwise take focus.
    const panel = panelRef.current
    if (panel && !panel.contains(document.activeElement)) panel.focus()

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKey)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
      // Defer: the panel is still in the DOM while cleanup runs, so focusing
      // synchronously would be undone when React removes it.
      window.setTimeout(() => {
        const target = consumeTrigger()
        if (target && document.contains(target)) target.focus()
      }, 0)
    }
  }, [onClose])

  return (
    <div
      className="drawer-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        ref={panelRef}
      >
        <button className="drawer__close" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
        {children}
      </aside>
    </div>
  )
}
