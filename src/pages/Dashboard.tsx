import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { AlertTriangle, ArrowRight, Bot, Clock, ShieldAlert, Zap, Sparkles, MessagesSquare, Wallet } from 'lucide-react'
import { useStore, currentUser } from '../store'
import { PRICING, daysLeft, fmtPoints } from '../lib/billing'
import { money, relTime, STAGES } from '../lib/meta'
import { Avatar, Bar, Button, ChannelIcon, Flag, Stat } from '../components/ui'

export default function Dashboard() {
  const conversations = useStore((s) => s.conversations)
  const contacts = useStore((s) => s.contacts)
  const tasks = useStore((s) => s.tasks)
  const accounts = useStore((s) => s.accounts)
  const aiActions = useStore((s) => s.aiActions)
  const agents = useStore((s) => s.agents)
  const billing = useStore((s) => s.billing)
  const nav = useNavigate()

  const pending = conversations.filter((c) => c.mode === 'pending')
  const overdue = tasks.filter((t) => !t.done && t.due < Date.now())
  const banned = accounts.filter((a) => a.status === 'banned')
  const review = aiActions.filter((a) => a.status === 'pending_review')
  const pipelineValue = contacts.filter((c) => !['won', 'lost'].includes(c.stage)).reduce((a, c) => a + c.dealValue, 0)
  const hour = new Date().getHours()
  const greet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

  const todo = [
    ...pending.map((c) => {
      const ct = contacts.find((x) => x.id === c.contactId)!
      return { key: c.id, icon: <AlertTriangle size={15} />, tone: 'text-amber-600 bg-amber-50', title: `${ct.name} 等待人工接管`, sub: c.handoffReason, to: `/inbox?c=${c.id}`, cta: '去接管' }
    }),
    ...overdue.map((t) => {
      const ct = contacts.find((x) => x.id === t.contactId)
      return { key: t.id, icon: <Clock size={15} />, tone: 'text-red-600 bg-red-50', title: t.title, sub: `${ct?.name ?? ''} · 逾期 ${relTime(t.due).replace('前', '')}`, to: '/tasks', cta: '去处理' }
    }),
    ...(review.length ? [{ key: 'review', icon: <Zap size={15} />, tone: 'text-brand-700 bg-brand-50', title: `${review.length} 个 AI 操作等待确认`, sub: 'AI 客服 Adam 开启了「先由人工确认」', to: '/ai/actions', cta: '去确认' }] : []),
    ...(billing.points < PRICING.lowBalancePoints
      ? [{ key: 'low', icon: <Wallet size={15} />, tone: 'text-red-600 bg-red-50', title: `算力余额仅剩 ${fmtPoints(billing.points)} 点`, sub: '余额不足时 AI 客服会停止回复并全部转人工', to: '/billing', cta: '去充值' }]
      : []),
    ...(daysLeft(billing.expiresAt) <= 7
      ? [{ key: 'exp', icon: <Clock size={15} />, tone: 'text-amber-600 bg-amber-50', title: `套餐 ${daysLeft(billing.expiresAt)} 天后到期`, sub: '到期后渠道账号将断开连接，客户数据保留 30 天', to: '/billing', cta: '去续费' }]
      : []),
    ...banned.map((a) => ({ key: a.id, icon: <ShieldAlert size={15} />, tone: 'text-red-600 bg-red-50', title: `账号「${a.name}」已被封禁`, sub: `${a.friends} 位好友需要换号重新触达`, to: '/accounts', cta: '查看' })),
  ]

  return (
    <>
      <div className="ai-surface mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl px-5 py-4">
        <div className="min-w-0">
          <h1 className="text-base font-bold">
            {greet}，{currentUser.name}
          </h1>
          <p className="mt-1 text-[13px] text-stone-500">
            今天 AI 客服已接待 <b className="tnum text-ink">318</b> 个会话，其中 <b className="tnum text-ink">264</b> 个无需人工介入。
          </p>
        </div>
        <span className="pill-ai ml-auto">
          <Sparkles size={11} /> AI 自动接待率 83.0%
        </span>
        <Button variant="primary" icon={<MessagesSquare size={15} />} onClick={() => nav('/inbox')}>
          打开会话
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="今日新客户" value="127" sub="较昨日 +14" tone="up" />
        <Stat label="今日会话" value="382" sub="AI 318 · 人工 64" />
        <Stat label="AI 独立解决率" value="83.0%" sub="较昨日 +1.8pt" tone="up" />
        <Stat label="进行中商机" value={money(pipelineValue)} sub={`${contacts.filter((c) => !['won', 'lost'].includes(c.stage)).length} 个客户`} />
        <Stat label="本月成交" value="$268,940" sub="目标 $400,000 · 67%" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="card">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <h2 className="font-semibold">
              需要你处理 <span className="tnum ml-1 text-sm font-normal text-stone-400">{todo.length}</span>
            </h2>
          </div>
          {todo.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-stone-500">都处理完了，AI 正在接待其余客户</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {todo.map((t) => (
                <Link key={t.key} to={t.to} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-stone-50">
                  <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', t.tone)}>{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{t.title}</p>
                    <p className="truncate text-xs text-stone-500">{t.sub}</p>
                  </div>
                  <span className="flex items-center gap-0.5 text-xs text-stone-400 group-hover:text-brand-700">
                    {t.cta} <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <h2 className="font-semibold">AI 客服状态</h2>
            <Link to="/ai/agents" className="text-xs text-stone-500 hover:text-brand-700">管理</Link>
          </div>
          <div className="space-y-4 px-5 py-4">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: a.avatar }}>
                  <Bot size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">
                      {a.name}
                      <span className={clsx('ml-1.5 text-xs font-normal', a.status === 'active' ? 'text-brand-600' : 'text-stone-400')}>{a.status === 'active' ? '接待中' : '已暂停'}</span>
                    </span>
                    <span className="tnum text-xs text-stone-500">解决率 {a.stats.autoRate}%</span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={a.stats.autoRate} max={100} className={a.status === 'active' ? 'bg-brand-500' : 'bg-stone-300'} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <h2 className="font-semibold">高意向客户</h2>
            <Link to="/customers" className="text-xs text-stone-500 hover:text-brand-700">全部客户</Link>
          </div>
          <div className="divide-y divide-stone-100">
            {contacts
              .filter((c) => !['won', 'lost'].includes(c.stage))
              .sort((a, b) => b.intent - a.intent)
              .slice(0, 5)
              .map((c) => {
                const conv = conversations.find((v) => v.contactId === c.id)
                const st = STAGES.find((s) => s.key === c.stage)!
                return (
                  <button key={c.id} onClick={() => conv && nav(`/inbox?c=${conv.id}`)} className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-stone-50">
                    <Avatar name={c.name} color={c.color} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {c.fields.company || c.name} <Flag flag={c.flag} />
                      </p>
                      <p className="flex items-center gap-1 text-xs text-stone-500">
                        <ChannelIcon channel={c.channel} size={11} /> {st.label} · {relTime(c.lastActiveAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tnum text-[13px] font-semibold">{money(c.dealValue)}</p>
                      <p className="tnum text-xs text-brand-700">意向 {c.intent}</p>
                    </div>
                  </button>
                )
              })}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <h2 className="flex items-center gap-1.5 font-semibold">
              <Sparkles size={15} className="text-ai" /> AI 刚刚做了什么
            </h2>
            <Link to="/ai/actions" className="text-xs text-stone-500 hover:text-brand-700">日志</Link>
          </div>
          <ol className="space-y-3 px-5 py-4">
            {[...aiActions].sort((a, b) => b.time - a.time).slice(0, 6).map((a) => {
              const c = contacts.find((x) => x.id === a.contactId)
              const g = agents.find((x) => x.id === a.agentId)
              return (
                <li key={a.id} className="flex gap-2.5 text-[13px]">
                  <span className={clsx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', a.status === 'applied' ? 'bg-brand-500' : a.status === 'pending_review' ? 'bg-amber-500' : 'bg-stone-300')} />
                  <div className="min-w-0">
                    <p className={clsx('leading-snug', a.status === 'reverted' && 'text-stone-400 line-through')}>
                      <b className="font-medium">{g?.name}</b> 给 {c?.name} {a.label}「{a.detail}」
                    </p>
                    <p className="text-xs text-stone-400">{relTime(a.time)}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </>
  )
}
