import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  KanbanSquare,
  ListTodo,
  Send,
  Workflow,
  Link2,
  Bot,
  BookOpen,
  History,
  Smartphone,
  BarChart3,
  Settings,
  Bell,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
  Wallet,
} from 'lucide-react'
import { useStore, currentUser } from '../store'
import { Toasts, TOPBAR_SLOT_ID } from '../components/ui'
import { HandoffAlert } from '../components/HandoffAlert'
import { BillingCheckout } from '../components/BillingCheckout'
import { PRICING, daysLeft, fmtPoints } from '../lib/billing'

const PAGE_META: { match: (p: string) => boolean; title: string; subtitle: string }[] = [
  { match: (p) => p === '/', title: '工作台', subtitle: '今日接待、待办与商机概况' },
  { match: (p) => p.startsWith('/inbox'), title: '客服工作台', subtitle: 'AI 托管与人工接管的统一会话台' },
  { match: (p) => p.startsWith('/customers'), title: '客户管理', subtitle: '全渠道客户档案、标签与负责人' },
  { match: (p) => p.startsWith('/pipeline'), title: '销售管道', subtitle: '按阶段推进商机' },
  { match: (p) => p.startsWith('/tasks'), title: '跟进任务', subtitle: 'AI、SOP 与人工创建的待办' },
  { match: (p) => p.startsWith('/campaigns'), title: '群发任务', subtitle: '按标签与阶段批量触达客户' },
  { match: (p) => p.startsWith('/sop'), title: 'SOP 自动跟进', subtitle: '按节奏自动培育客户' },
  { match: (p) => p.startsWith('/links'), title: '分流链接', subtitle: '广告流量多账号分流与来源追踪' },
  { match: (p) => p.startsWith('/ai/agents'), title: 'AI 客服', subtitle: '按国家／语言与平台管理提示词模板，并配置转人工与 CRM 写回' },
  { match: (p) => p.startsWith('/ai/knowledge'), title: '知识库', subtitle: '企业全局资料库；每份文档、网页或手工资料都可关联一个或多个 AI 客服' },
  { match: (p) => p.startsWith('/ai/actions'), title: 'AI 动作日志', subtitle: 'AI 在 CRM 中的操作记录与审核' },
  { match: (p) => p.startsWith('/accounts'), title: '账号矩阵', subtitle: '渠道账号、代理与健康度' },
  { match: (p) => p.startsWith('/analytics'), title: '数据分析', subtitle: '获客漏斗与接待效果' },
  { match: (p) => p.startsWith('/billing'), title: '订阅与用量', subtitle: '购买席位与算力、续费套餐，并查看消耗明细' },
  { match: (p) => p.startsWith('/settings'), title: '设置', subtitle: '团队、权限与通用配置' },
]

export function AppLayout() {
  const conversations = useStore((s) => s.conversations)
  const tasks = useStore((s) => s.tasks)
  const aiActions = useStore((s) => s.aiActions)
  const billing = useStore((s) => s.billing)
  const accounts = useStore((s) => s.accounts)
  const orders = useStore((s) => s.orders)
  const openBilling = useStore((s) => s.openBilling)
  const loc = useLocation()
  const nav = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const pending = conversations.filter((c) => c.mode === 'pending').length
  const unread = conversations.reduce((a, c) => a + c.unread, 0)
  const overdue = tasks.filter((t) => !t.done && t.due < Date.now()).length
  const review = aiActions.filter((a) => a.status === 'pending_review').length
  const lowBalance = billing.points < PRICING.lowBalancePoints
  const seatsFull = accounts.length >= billing.seats
  const expiring = daysLeft(billing.expiresAt) <= 7
  const billingAlerts = (lowBalance ? 1 : 0) + (seatsFull ? 1 : 0) + (expiring ? 1 : 0) + orders.filter((o) => o.status === 'pending').length
  const cyclePct = Math.round((billing.cycleUsed / Math.max(1, billing.cycleUsed + billing.points)) * 100)

  const groups: { title?: string; items: { to: string; label: string; icon: typeof Users; badge?: number; badgeTone?: 'warn' | 'brand' }[] }[] = [
    {
      items: [
        { to: '/', label: '工作台', icon: LayoutDashboard },
        { to: '/inbox', label: '客服工作台', icon: MessagesSquare, badge: pending || unread, badgeTone: pending ? 'warn' : 'brand' },
      ],
    },
    {
      title: '客户 CRM',
      items: [
        { to: '/customers', label: '客户管理', icon: Users },
        { to: '/pipeline', label: '销售管道', icon: KanbanSquare },
        { to: '/tasks', label: '跟进任务', icon: ListTodo, badge: overdue, badgeTone: 'warn' },
      ],
    },
    {
      title: '营销获客',
      items: [
        { to: '/campaigns', label: '群发任务', icon: Send },
        { to: '/sop', label: 'SOP 自动跟进', icon: Workflow },
        { to: '/links', label: '分流链接', icon: Link2 },
      ],
    },
    {
      title: 'AI 客服',
      items: [
        { to: '/ai/agents', label: 'AI 客服', icon: Bot },
        { to: '/ai/knowledge', label: '知识库', icon: BookOpen },
        { to: '/ai/actions', label: 'AI 动作日志', icon: History, badge: review, badgeTone: 'warn' },
      ],
    },
    {
      title: '渠道与数据',
      items: [
        { to: '/accounts', label: '账号矩阵', icon: Smartphone },
        { to: '/analytics', label: '数据分析', icon: BarChart3 },
      ],
    },
    {
      title: '账户',
      items: [
        { to: '/billing', label: '订阅与用量', icon: Wallet, badge: billingAlerts, badgeTone: 'warn' },
        { to: '/settings', label: '设置', icon: Settings },
      ],
    },
  ]

  const isInbox = loc.pathname.startsWith('/inbox')
  const meta = PAGE_META.find((m) => m.match(loc.pathname)) ?? PAGE_META[0]

  return (
    <div className="flex h-full bg-bg">
      <aside className={clsx('relative z-10 flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200', collapsed ? 'w-16' : 'w-[220px]')}>
        <div className={clsx('flex h-14 shrink-0 items-center gap-2.5 border-b border-divider', collapsed ? 'justify-center' : 'px-4')}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#16C05B] to-[#0EA5E9] text-white shadow-signal">
            <Sparkles size={16} />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold leading-tight tracking-tight">LinkPilot</p>
              <p className="truncate text-[10.5px] font-medium text-muted">出海 AI 营销 CRM</p>
            </div>
          )}
        </div>
        <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-3">
          {groups.map((g, gi) => (
            <div key={gi} className={gi ? 'mt-4' : ''}>
              {g.title &&
                (collapsed ? (
                  <div className="mx-auto my-2 h-px w-6 bg-border" />
                ) : (
                  <p className="nav-group">{g.title}</p>
                ))}
              <div className="space-y-0.5">
                {g.items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.to === '/'}
                    title={collapsed ? it.label : undefined}
                    className={({ isActive }) => clsx('nav-link', collapsed && 'justify-center px-0', isActive && 'nav-link-active')}
                  >
                    <it.icon size={16} />
                    {!collapsed && <span className="flex-1">{it.label}</span>}
                    {!!it.badge &&
                      (collapsed ? (
                        <span className={clsx('absolute right-2 top-2 h-1.5 w-1.5 rounded-full', it.badgeTone === 'warn' ? 'bg-warn' : 'bg-line')} />
                      ) : (
                        <span className={clsx('tnum inline-flex min-w-[20px] justify-center rounded-md px-1.5 text-[11px] font-semibold leading-[18px]', it.badgeTone === 'warn' ? 'bg-warn-bg text-warn' : 'bg-line-dark text-line-text')}>
                          {it.badge}
                        </span>
                      ))}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {!collapsed && (
          <div className={clsx('mx-3 mb-2 rounded-2xl border p-3 shadow-card', lowBalance ? 'border-danger/30 bg-danger-bg/40' : 'aurora border-border')}>
            <div className="flex items-center justify-between text-xs">
              <button onClick={() => nav('/billing')} className="pill-ai" title="查看订阅与用量">
                <Sparkles size={11} /> AI 算力
              </button>
              <button onClick={() => openBilling('points')} className={clsx('rounded-md px-1.5 py-0.5 text-xs font-medium', lowBalance ? 'bg-red-500 text-white' : 'text-brand-700 hover:bg-brand-50')}>
                充值
              </button>
            </div>
            <button onClick={() => nav('/billing')} className="mt-2 block w-full text-left">
              <p className={clsx('tnum text-[15px] font-bold leading-none', lowBalance ? 'text-red-600' : 'text-ink')}>
                {fmtPoints(billing.points)} <span className="text-[11px] font-normal text-stone-400">点</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div className={clsx('h-full rounded-full', lowBalance ? 'bg-red-500' : 'bg-ai')} style={{ width: `${100 - cyclePct}%` }} />
              </div>
              <p className="tnum mt-1.5 flex justify-between text-[11px] text-stone-500">
                <span>{lowBalance ? '余额不足' : `席位 ${accounts.length} / ${billing.seats}`}</span>
                <span>剩 {daysLeft(billing.expiresAt)} 天</span>
              </p>
            </button>
          </div>
        )}
        <div className="border-t border-divider p-3">
          <button onClick={() => setCollapsed((v) => !v)} title={collapsed ? '展开侧边栏' : '收起侧边栏'} className={clsx('nav-link w-full', collapsed && 'justify-center px-0')}>
            {collapsed ? (
              <ChevronsRight size={17} />
            ) : (
              <>
                <ChevronsLeft size={17} />
                收起侧边栏
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="client-topbar z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border px-6">
          <div id={TOPBAR_SLOT_ID} className="peer flex min-w-0 flex-1 items-center empty:hidden" />
          <div className="hidden min-w-0 flex-1 peer-empty:block">
            <p className="truncate text-[15px] font-bold leading-tight">{meta.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{meta.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className={clsx('hidden items-center rounded-[10px] border pl-2.5 md:flex', lowBalance ? 'border-danger/30 bg-danger-bg' : 'border-border bg-card')}>
              <button onClick={() => nav('/billing')} className="flex items-center gap-1.5 py-1 pr-2 text-xs text-muted" title="查看订阅与用量">
                <Sparkles size={12} className={lowBalance ? 'text-danger' : 'text-info'} />
                算力 <b className={clsx('tnum font-semibold', lowBalance ? 'text-danger' : 'text-text')}>{fmtPoints(billing.points)}</b>
              </button>
              <button onClick={() => openBilling('points')} className="h-7 rounded-r-[9px] border-l border-border px-2.5 text-xs font-semibold text-line-text hover:bg-line-dark">
                充值
              </button>
            </span>
            <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-card2 hover:text-text" aria-label="通知">
              <Bell size={17} />
              {pending > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warn ring-2 ring-white" />}
            </button>
            <span className="h-5 w-px bg-border" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-text text-[11px] font-bold text-white">{currentUser.name.slice(-1)}</span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-xs font-semibold">{currentUser.name}</span>
              <span className="text-[10.5px] text-muted">{currentUser.role} · SolarVolt</span>
            </span>
          </div>
        </header>
        <main className={clsx('client-content min-h-0 flex-1', isInbox ? 'overflow-hidden' : 'scroll-thin overflow-y-auto')}>
          {isInbox ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-[1360px] px-6 py-5">
              <Outlet />
            </div>
          )}
        </main>
      </div>
      <Toasts />
      <HandoffAlert />
      <BillingCheckout />
    </div>
  )
}
