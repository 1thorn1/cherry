import { useEffect, useRef, type ReactNode } from 'react'

export default function Collapse({ open, children, className = '', focusOnOpen = false }: {
  open: boolean
  children: ReactNode
  className?: string
  focusOnOpen?: boolean
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open && focusOnOpen) {
      contentRef.current?.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true })
    }
  }, [open, focusOnOpen])
  return (
    <div className={`collapse ${open ? 'collapse-open' : ''} ${className}`} aria-hidden={!open} inert={!open}>
      <div ref={contentRef} className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
