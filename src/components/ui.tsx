import { useEffect, useLayoutEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { X, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { FaWhatsapp, FaLine, FaTelegramPlane, FaFacebookMessenger } from 'react-icons/fa'
import type { Channel, Stage } from '../types'
import { CHANNELS, stageMeta } from '../lib/meta'
import { useStore } from '../store'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md'; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40',
        size === 'md' ? 'h-9 rounded-[10px] px-3.5 text-sm' : 'h-7 rounded-lg px-2.5 text-xs',
        variant === 'primary' && 'bg-text text-white shadow-glow hover:bg-text/90',
        variant === 'secondary' && 'border border-border bg-card text-text shadow-card hover:border-muted/30 hover:bg-card2',
        variant === 'ghost' && 'text-muted hover:bg-card2 hover:text-text',
        variant === 'soft' && 'bg-line-dark text-line-text hover:bg-line/15',
        variant === 'danger' && 'border border-danger/25 bg-danger-bg text-danger hover:bg-danger/15',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('pill', className ?? 'bg-stone-50 text-stone-500 ring-stone-200')}>
      {children}
    </span>
  )
}

export function StageBadge({ stage }: { stage: Stage }) {
  const m = stageMeta(stage)
  return (
    <Badge className={m.color}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </Badge>
  )
}

export function Avatar({ name, color, size = 32, ring }: { name: string; color: string; size?: number; ring?: boolean }) {
  const initial = /^[\u4e00-\u9fa5]/.test(name) ? name.slice(-2) : name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  return (
    <span
      className={clsx('inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white', ring && 'ring-2 ring-white')}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initial}
    </span>
  )
}

export function Flag({ flag }: { flag: string }) {
  const code = Array.from(flag)
    .map((ch) => String.fromCharCode((ch.codePointAt(0) ?? 0) - 0x1f1e6 + 65))
    .join('')
  return <span className="tnum inline-block rounded border border-stone-200 bg-stone-50 px-1 align-middle text-[10px] font-semibold leading-[14px] tracking-wide text-stone-500">{code}</span>
}

const CH_ICON = { whatsapp: FaWhatsapp, line: FaLine, telegram: FaTelegramPlane, messenger: FaFacebookMessenger }

export function ChannelIcon({ channel, size = 14, withLabel }: { channel: Channel; size?: number; withLabel?: boolean }) {
  const Icon = CH_ICON[channel]
  const m = CHANNELS[channel]
  if (withLabel)
    return (
      <span className="inline-flex items-center gap-1.5 text-stone-600">
        <Icon size={size} color={m.color} />
        <span className="text-[13px]">{m.label}</span>
      </span>
    )
  return <Icon size={size} color={m.color} aria-label={m.label} />
}

export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={clsx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-40',
        checked ? 'bg-brand-600' : 'bg-stone-300',
      )}
    >
      <span className={clsx('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-out', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
    </button>
  )
}

export function Tabs<K extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: K
  onChange: (k: K) => void
  items: { key: K; label: ReactNode; count?: number }[]
  className?: string
}) {
  return (
    <div className={clsx('flex items-center gap-1 border-b border-stone-200', className)}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={clsx(
            'relative -mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors duration-150',
            value === it.key ? 'border-brand-600 font-medium text-ink' : 'border-transparent text-stone-500 hover:text-stone-800',
          )}
        >
          {it.label}
          {it.count !== undefined && (
            <span className={clsx('tnum rounded-full px-1.5 text-xs', value === it.key ? 'bg-brand-50 text-brand-700' : 'bg-stone-100 text-stone-500')}>{it.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function Segmented<K extends string>({ value, onChange, items }: { value: K; onChange: (k: K) => void; items: { key: K; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-lg bg-stone-100 p-0.5">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={clsx(
            'whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] transition-[background-color,color,box-shadow] duration-150',
            value === it.key ? 'bg-white font-medium text-ink shadow-card' : 'text-stone-500 hover:text-stone-800',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
  bodyClassName,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
  bodyClassName?: string
}) {
  useEsc(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-[#14161F]/45 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal className="relative flex max-h-[90dvh] w-full animate-pop-in flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-4">
          <h3 className="min-w-0 text-[15px] font-bold text-text">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted transition-colors hover:bg-card2 hover:text-text" aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className={clsx('scroll-thin flex-1 overflow-y-auto', bodyClassName ?? 'px-5 py-4')}>{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-divider bg-card px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children, width = 520 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; width?: number }) {
  useEsc(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full animate-slide-in flex-col border-l border-stone-200 bg-white shadow-pop" style={{ maxWidth: width }}>
        <div className="flex h-16 items-center justify-between border-b border-stone-200 px-5">
          <div className="min-w-0 flex-1 text-[15px] font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  )
}

export function Empty({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="ai-surface mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-ai-text shadow-card">{icon}</div>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-[13px] text-stone-500">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const TOPBAR_SLOT_ID = 'topbar-page-slot'

/** 标题、说明与页面级操作渲染到顶栏（与 AI 客服前端一致），内容区只留业务本身。 */
export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => setSlot(document.getElementById(TOPBAR_SLOT_ID)), [])
  if (!slot) return null
  return createPortal(
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-bold leading-tight text-text">{title}</h1>
        {desc && <p className="mt-0.5 truncate text-xs text-muted" title={desc}>{desc}</p>}
      </div>
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </div>,
    slot,
  )
}

export function KpiGrid({ items, className }: { items: { label: string; value: ReactNode; icon: ReactNode; accent?: string }[]; className?: string }) {
  return (
    <div className={clsx('grid gap-3', className ?? 'grid-cols-2 lg:grid-cols-4')}>
      {items.map((it) => (
        <div key={it.label} className="kpi-card flex items-center gap-3">
          <span className={clsx('kpi-icon', it.accent)}>{it.icon}</span>
          <div className="min-w-0">
            <p className="kpi-label">{it.label}</p>
            <p className="kpi-value">{it.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function usePagination<T>(items: T[], size: number) {
  const [page, setPage] = useState(1)
  const total = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(page, total)
  return { page: current, total, setPage, rows: items.slice((current - 1) * size, current * size), count: items.length }
}

export function Pagination({ page, total, count, onChange }: { page: number; total: number; count: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-4 text-xs text-muted">
      <span className="tnum">
        共 {count} 条 · 第 {page} / {total} 页
      </span>
      <div className="flex items-center gap-2">
        <button className="btn-ghost min-h-8 px-3 py-1 text-xs" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          上一页
        </button>
        <button className="btn-ghost min-h-8 px-3 py-1 text-xs" disabled={page >= total} onClick={() => onChange(page + 1)}>
          下一页
        </button>
      </div>
    </div>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'up' | 'down' }) {
  return (
    <div className="panel px-4 py-3.5">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="tnum mt-1 text-[22px] font-semibold leading-tight">{value}</p>
      {sub && <p className={clsx('tnum mt-0.5 text-xs', tone === 'up' ? 'text-brand-600' : tone === 'down' ? 'text-red-500' : 'text-stone-400')}>{sub}</p>}
    </div>
  )
}

export function Ring({ value, size = 44, stroke = 4 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = value >= 80 ? '#16C05B' : value >= 50 ? '#B47804' : '#DC2626'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#EEF2F6" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="tnum rotate-90 fill-stone-700 text-[11px] font-semibold" style={{ transformOrigin: 'center' }}>
        {value}
      </text>
    </svg>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-stone-400">{hint}</p>}
    </div>
  )
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex animate-pop-in items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm text-white shadow-pop" onClick={() => dismiss(t.id)}>
          {t.tone === 'success' && <CheckCircle2 size={16} className="text-brand-300" />}
          {t.tone === 'info' && <Info size={16} className="text-blue-300" />}
          {t.tone === 'warn' && <AlertTriangle size={16} className="text-amber-300" />}
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
      <div className={clsx('h-full rounded-full', className ?? 'bg-brand-500')} style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} />
    </div>
  )
}
