import { cn } from '@/lib/utils'

export function BrandMark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight', className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="7" className={light ? 'fill-white' : 'fill-primary'} />
        <path d="M10 8v16" className="stroke-secondary" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="9" r="3" className={light ? 'fill-primary' : 'fill-primary-foreground'} />
        <circle cx="10" cy="16" r="3" className={light ? 'fill-primary' : 'fill-primary-foreground'} />
        <circle cx="10" cy="23" r="2.4" className="fill-none stroke-secondary" strokeWidth="2" />
        <rect x="16" y="7" width="10" height="4" rx="1.5" className={light ? 'fill-primary' : 'fill-primary-foreground'} />
        <rect x="16" y="14" width="8" height="4" rx="1.5" className="fill-secondary" />
      </svg>
      Waybill
    </span>
  )
}
