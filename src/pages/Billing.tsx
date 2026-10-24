import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  Crown,
  Cpu,
  Headset,
  Languages,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react'
import { useStore, useMembers } from '../store'
import { ORDER_KIND_LABEL, PAY_METHODS, PLANS, PRICING, daysLeft, fmtPoints, fmtUsd, pointsToUsd } from '../lib/billing'
import { CHANNELS, dateTime, money, relTime, stageMeta } from '../lib/meta'
import type { Order, PlanKey } from '../types'
import { Avatar, Badge, Bar, Button, ChannelIcon, Drawer, PageHeader, Tabs } from '../components/ui'
import { ACCOUNT_STATUS } from '../components/workbench/meta'

type Tab = 'accounts' | 'agents' | 'trend' | 'orders' | 'pricing'

const ORDER_STATUS: Record<Order['status'], { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: '待确认', cls: 'pill-warn', icon: Clock },
  done: { label: '已到账', cls: 'pill-on', icon: CheckCircle2 },
  rejected: { label: '已拒绝', cls: 'pill-off', icon: XCircle },
}

function orderQty(o: Order) {
  if (o.kind === 'seats') return `${o.seats} 席`
  if (o.kind === 'renew') return `${o.months} 个月`
  if (o.kind === 'points') return `${fmtPoints(o.points ?? 0)} 点`
  return o.plan ? PLANS[o.plan].name : '—'
}

export default function Billing() {
  const billing = useStore((s) => s.billing)
  const accounts = useStore((s) => s.accounts)
  const orders = useStore((s) => s.orders)
  const { openBilling } = useStore()
  const [tab, setTab] = useState<Tab>('accounts')

  const plan = PLANS[billing.plan]
  const left = daysLeft(billing.expiresAt)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length

  return (
    <>
      <PageHeader
        title="订阅与用量"
        desc="席位决定能接入多少个 IM 账号，算力是 AI 接待的燃料"
        actions={
          <>
            <Button size="sm" icon={<RefreshCw size={14} />} onClick={() => openBilling('renew')}>
              续费
            </Button>
            {billing.plan !== 'enterprise' && (
              <Button size="sm" variant="primary" icon={<ArrowUpRight size={14} />} onClick={() => openBilling('upgrade')}>
                升级套餐
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-card px-5 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
          <Crown size={17} />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold">
            {plan.name}
            <span className="pill-on">生效中</span>
          </p>
          <p className="text-xs text-stone-500">
            {plan.desc} · {plan.agents} · {plan.members}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[11px] text-stone-400">到期时间</p>
          <p className={clsx('tnum text-sm font-semibold', left <= 7 ? 'text-danger' : 'text-ink')}>
            {new Date(billing.expiresAt).toLocaleDateString('zh-CN')} · 剩 {left} 天
          </p>
        </div>
      </div>

      <ResourceCards />
      <RoiPanel />

      <div className="card mt-4">
        <Tabs<Tab>
          className="px-3"
          value={tab}
          onChange={setTab}
          items={[
            { key: 'accounts', label: '渠道账号用量', count: accounts.length },
            { key: 'agents', label: 'AI 客服用量' },
            { key: 'trend', label: '消耗趋势' },
            { key: 'orders', label: '购买记录', count: pendingOrders || undefined },
            { key: 'pricing', label: '套餐与价格' },
          ]}
        />
        {tab === 'accounts' && <AccountUsage />}
        {tab === 'agents' && <AgentUsage />}
        {tab === 'trend' && <Trend />}
        {tab === 'orders' && <Orders />}
        {tab === 'pricing' && <Pricing />}
      </div>
    </>
  )
}

function ResourceCards() {
  const billing = useStore((s) => s.billing)
  const accounts = useStore((s) => s.accounts)
  const usageDaily = useStore((s) => s.usageDaily)
  const { openBilling } = useStore()
  const plan = PLANS[billing.plan]

  const used = accounts.length
  const free = Math.max(0, billing.seats - used)
  const seatPct = Math.round((used / Math.max(1, billing.seats)) * 100)
  const low = billing.points < PRICING.lowBalancePoints
  const last7 = usageDaily.slice(-8, -1)
  const avgDaily = last7.reduce((a, d) => a + d.ai + d.translate, 0) / Math.max(1, last7.length)
  const runway = avgDaily ? Math.floor(billing.points / avgDaily) : 0
  const consumedPct = Math.round((billing.cycleUsed / Math.max(1, billing.cycleUsed + billing.points)) * 100)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-line/20 bg-gradient-to-br from-line/10 via-card to-line/5 p-5">
        <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-line/10 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-line/15 text-line">
            <Users size={19} />
          </span>
          <div>
            <p className="text-[15px] font-bold">渠道席位</p>
            <p className="text-xs text-stone-500">每接入 1 个 IM 账号占 1 席 · {fmtUsd(plan.seatUsd)} / 席 / 月</p>
          </div>
          {free <= 0 ? <span className="pill-off ml-auto">席位已满</span> : seatPct >= 80 ? <span className="pill-warn ml-auto">即将用尽</span> : <span className="pill-on ml-auto">充足</span>}
        </div>
        <div className="relative mt-5 flex items-end gap-2">
          <span className="tnum text-4xl font-extrabold leading-none text-line">{free}</span>
          <span className="mb-0.5 text-sm text-stone-500">席可用</span>
          <span className="mb-0.5 ml-auto text-xs text-stone-500">
            已用 <b className="tnum text-ink">{used}</b> / {billing.seats} 席
          </span>
        </div>
        <div className="relative mt-3">
          <Bar value={used} max={billing.seats} className={seatPct >= 100 ? 'bg-danger' : seatPct >= 80 ? 'bg-warn' : 'bg-line'} />
        </div>
        <div className="relative mt-auto flex items-center gap-2 pt-5">
          <span className="text-xs text-stone-500">{free <= 0 ? '席位用完后无法再接入新账号，分流链接也无法扩容' : `本月席位费 ${fmtUsd(billing.seats * plan.seatUsd)}`}</span>
          <Button variant="primary" size="sm" className="ml-auto" icon={<ShoppingCart size={13} />} onClick={() => openBilling('seats')}>
            购买渠道席位
          </Button>
        </div>
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-info/20 bg-gradient-to-br from-info/10 via-card to-ai-bg/40 p-5">
        <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-info/10 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/15 text-info">
            <Cpu size={19} />
          </span>
          <div>
            <p className="text-[15px] font-bold">算力余额</p>
            <p className="text-xs text-stone-500">
              AI 回复 {fmtPoints(PRICING.replyPoints)} 点/条 · 翻译 {PRICING.translatePoints} 点/条
            </p>
          </div>
          {low ? <span className="pill-off ml-auto">余额偏低</span> : <span className="pill-on ml-auto">充足</span>}
        </div>
        <div className="relative mt-5 flex items-end gap-2">
          <span className="tnum text-4xl font-extrabold leading-none text-info">{fmtPoints(billing.points)}</span>
          <span className="mb-0.5 text-sm text-stone-500">算力点 ≈ {fmtUsd(pointsToUsd(billing.points))}</span>
          <span className="mb-0.5 ml-auto text-xs text-stone-500">本周期已用 {consumedPct}%</span>
        </div>
        <div className="relative mt-3">
          <Bar value={billing.cycleUsed} max={billing.cycleUsed + billing.points} className="bg-info" />
        </div>
        <div className="relative mt-auto flex items-center gap-2 pt-5">
          <span className="text-xs text-stone-500">
            近 7 天日均 {fmtPoints(avgDaily)} 点，预计可用 <b className={clsx('tnum', runway <= 7 ? 'text-danger' : 'text-ink')}>{runway}</b> 天
          </span>
          <Button variant="primary" size="sm" className="ml-auto" icon={<Cpu size={13} />} onClick={() => openBilling('points')}>
            购买算力
          </Button>
        </div>
      </div>
    </div>
  )
}

/** 把算力花费和 AI 带来的业务结果放在一起：老板关心的是「花 1 美元换回多少商机」 */
function RoiPanel() {
  const billing = useStore((s) => s.billing)
  const conversations = useStore((s) => s.conversations)
  const messages = useStore((s) => s.messages)
  const aiActions = useStore((s) => s.aiActions)
  const contacts = useStore((s) => s.contacts)

  const m = useMemo(() => {
    const aiConvs = conversations.filter((c) => messages.some((x) => x.conversationId === c.id && x.from === 'ai'))
    const solo = aiConvs.filter((c) => c.mode !== 'pending' && !messages.some((x) => x.conversationId === c.id && x.from === 'agent'))
    const applied = aiActions.filter((a) => a.status === 'applied')
    const writebacks = applied.filter((a) => a.type !== 'handoff').length
    const handoffs = aiActions.filter((a) => a.type === 'handoff').length
    const advancedIds = new Set(applied.filter((a) => a.type === 'update_stage').map((a) => a.contactId))
    aiConvs.forEach((c) => advancedIds.add(c.contactId))
    const pipeline = contacts.filter((c) => advancedIds.has(c.id) && c.stage !== 'lost').reduce((s, c) => s + c.dealValue, 0)
    const won = contacts.filter((c) => advancedIds.has(c.id) && c.stage === 'won').reduce((s, c) => s + c.dealValue, 0)
    const spend = pointsToUsd(billing.cycleUsed)
    return {
      aiConvs: aiConvs.length,
      soloRate: aiConvs.length ? Math.round((solo.length / aiConvs.length) * 100) : 0,
      writebacks,
      handoffs,
      leads: advancedIds.size,
      pipeline,
      won,
      spend,
      cpl: advancedIds.size ? spend / advancedIds.size : 0,
      roi: spend ? pipeline / spend : 0,
    }
  }, [conversations, messages, aiActions, contacts, billing.cycleUsed])

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai-bg text-ai">
            <TrendingUp size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold">AI 投入产出 · 本计费周期</p>
            <p className="text-[11px] text-stone-500">算力花费对应的接待量、CRM 写回和推进的商机</p>
          </div>
          <Link to="/analytics" className="ml-auto text-xs font-medium text-line-text no-underline hover:underline">
            查看数据分析 →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
          <RoiCell label="算力花费" value={fmtUsd(m.spend)} hint={`${fmtPoints(billing.cycleUsed)} 点`} />
          <RoiCell label="AI 接待会话" value={m.aiConvs.toLocaleString()} hint={`独立完成 ${m.soloRate}% · 转人工 ${m.handoffs} 次`} />
          <RoiCell label="写回 CRM" value={m.writebacks.toLocaleString()} hint="标签 / 阶段 / 字段 / 任务" />
          <RoiCell label="单个线索成本" value={fmtUsd(m.cpl)} hint={`AI 经手线索 ${m.leads} 个`} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-gradient-to-r from-ai-bg/70 to-line/10 px-4 py-3">
          <div>
            <p className="text-[11px] text-stone-500">AI 经手的商机金额</p>
            <p className="tnum text-xl font-extrabold">{money(m.pipeline)}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-500">其中已成交</p>
            <p className="tnum text-xl font-extrabold text-line">{money(m.won)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] text-stone-500">每 $1 算力撬动商机</p>
            <p className="tnum text-xl font-extrabold text-ai-text">{m.roi ? `$${Math.round(m.roi).toLocaleString()}` : '—'}</p>
          </div>
        </div>
      </div>
      <FallbackCard />
    </div>
  )
}

function RoiCell({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <p className="text-[11px] text-stone-500">{label}</p>
      <p className="tnum mt-0.5 text-lg font-bold">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-stone-400">{hint}</p>
    </div>
  )
}

/** 余额耗尽不能丢客户：AI 停下来，会话进待人工队列，负责人收到提醒 */
function FallbackCard() {
  const points = useStore((s) => s.billing.points)
  const { toast } = useStore()

  const drain = () => {
    useStore.setState((s) => ({ billing: { ...s.billing, points: Math.min(s.billing.points, 600) } }))
    toast('已模拟余额耗尽：去客服工作台让客户发条消息，看看 AI 如何兜底', 'warn')
  }

  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn-bg text-warn">
          <ShieldCheck size={16} />
        </span>
        <p className="text-sm font-semibold">余额预警与兜底</p>
      </div>
      <ul className="mt-3 space-y-2.5 text-[12.5px] text-stone-600">
        <li className="flex gap-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
          <span>
            余额低于 <b className="tnum">{fmtPoints(PRICING.lowBalancePoints)}</b> 点时，顶栏与侧栏提示充值
          </span>
        </li>
        <li className="flex gap-2">
          <Headset size={14} className="mt-0.5 shrink-0 text-warn" />
          <span>余额不足时 AI 自动暂停，会话进入「待人工」队列并弹窗提醒负责人</span>
        </li>
        <li className="flex gap-2">
          <Zap size={14} className="mt-0.5 shrink-0 text-line" />
          <span>充值到账后，AI 恢复接待，可在工作台一键「全部转 AI」</span>
        </li>
      </ul>
      <div className="mt-auto flex items-center gap-2 pt-4">
        <span className="text-[11px] text-stone-400">当前 {fmtPoints(points)} 点</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={drain}>
          演示：余额耗尽
        </Button>
      </div>
    </div>
  )
}

function AccountUsage() {
  const accounts = useStore((s) => s.accounts)
  const agents = useStore((s) => s.agents)
  const billing = useStore((s) => s.billing)
  const members = useMembers()
  const [openId, setOpenId] = useState<string | null>(null)
  const total = Object.values(billing.accountUsage).reduce((a, u) => a + u.points, 0)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <th className="th">渠道账号</th>
              <th className="th">平台</th>
              <th className="th">负责人</th>
              <th className="th">接待方式</th>
              <th className="th">资源占用</th>
              <th className="th text-right">AI 回复</th>
              <th className="th">算力消耗</th>
              <th className="th">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {accounts.map((a) => {
              const u = billing.accountUsage[a.id] ?? { replies: 0, points: 0 }
              const ag = agents.find((g) => g.id === a.agentId)
              const owner = members.find((m) => m.id === a.ownerId)
              const st = ACCOUNT_STATUS[a.status]
              return (
                <tr key={a.id} onClick={() => setOpenId(a.id)} className="cursor-pointer hover:bg-stone-50/70">
                  <td className="td">
                    <span className="flex items-center gap-2">
                      <ChannelIcon channel={a.channel} size={16} />
                      <span>
                        <span className="block font-medium">{a.name}</span>
                        <span className="tnum block text-[11px] text-stone-400">{a.handle}</span>
                      </span>
                    </span>
                  </td>
                  <td className="td">
                    <span className="pill-info">{CHANNELS[a.channel].label}</span>
                  </td>
                  <td className="td">{owner && <span className="flex items-center gap-1.5"><Avatar name={owner.name} color={owner.color} size={20} />{owner.name}</span>}</td>
                  <td className="td">
                    {ag ? (
                      <span className={ag.status === 'active' ? 'pill-ai' : 'pill-muted'}>
                        <Bot size={11} /> {ag.name}
                        {ag.status !== 'active' && ' · 暂停'}
                      </span>
                    ) : (
                      <span className="pill-warn">
                        <Headset size={11} /> 纯人工
                      </span>
                    )}
                  </td>
                  <td className="td tnum">1 席</td>
                  <td className="td tnum text-right">{u.replies.toLocaleString()}</td>
                  <td className="td w-[200px]">
                    <div className="flex items-center justify-between text-xs">
                      <b className="tnum">{fmtPoints(u.points)}</b>
                      <span className="tnum text-stone-400">{fmtUsd(pointsToUsd(u.points))}</span>
                    </div>
                    <div className="mt-1">
                      <Bar value={u.points} max={total} className="bg-info" />
                    </div>
                  </td>
                  <td className="td">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={clsx('h-2 w-2 rounded-full', st.dot)} />
                      {st.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-dashed border-border px-5 py-3 text-xs text-stone-400">点击账号查看每位客户的算力明细。解绑 AI 的账号只占席位、不消耗 AI 算力。</p>
      <AccountDrawer accountId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function AccountDrawer({ accountId, onClose }: { accountId: string | null; onClose: () => void }) {
  const account = useStore((s) => s.accounts.find((a) => a.id === accountId))
  const contacts = useStore((s) => s.contacts)
  const conversations = useStore((s) => s.conversations)
  const messages = useStore((s) => s.messages)
  const usage = useStore((s) => s.billing.accountUsage)

  const rows = useMemo(() => {
    if (!account) return []
    return contacts
      .filter((c) => c.accountId === account.id)
      .map((c) => {
        const convIds = conversations.filter((v) => v.contactId === c.id).map((v) => v.id)
        const ai = messages.filter((m) => convIds.includes(m.conversationId) && m.from === 'ai')
        const tr = messages.filter((m) => convIds.includes(m.conversationId) && m.from === 'agent').length
        return { c, convId: convIds[0], replies: ai.length, points: ai.length * PRICING.replyPoints + tr * PRICING.translatePoints, last: ai[ai.length - 1]?.time }
      })
      .sort((a, b) => b.points - a.points)
  }, [account, contacts, conversations, messages])

  if (!account) return null
  const u = usage[account.id] ?? { replies: 0, points: 0 }

  return (
    <Drawer
      open={!!accountId}
      onClose={onClose}
      width={680}
      title={
        <span className="flex items-center gap-2">
          <ChannelIcon channel={account.channel} size={16} /> {account.name} · 用量明细
        </span>
      }
    >
      <div className="grid grid-cols-3 gap-3 p-5">
        <MiniKpi label="客户数" value={rows.length.toLocaleString()} />
        <MiniKpi label="本周期 AI 回复" value={u.replies.toLocaleString()} />
        <MiniKpi label="算力消耗" value={`${fmtPoints(u.points)} 点`} sub={fmtUsd(pointsToUsd(u.points))} />
      </div>
      <div className="px-5 pb-5">
        <p className="mb-2 text-sm font-semibold">客户算力明细</p>
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <th className="th">客户</th>
              <th className="th">阶段</th>
              <th className="th text-right">AI 回复次数</th>
              <th className="th text-right">算力消耗</th>
              <th className="th">最近使用</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.map(({ c, convId, replies, points, last }) => (
              <tr key={c.id}>
                <td className="td">
                  <Link to={convId ? `/inbox?c=${convId}` : '/customers'} className="flex items-center gap-2 text-ink no-underline hover:underline">
                    <Avatar name={c.name} color={c.color} size={24} /> {c.name}
                  </Link>
                </td>
                <td className="td">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={clsx('h-1.5 w-1.5 rounded-full', stageMeta(c.stage).dot)} />
                    {stageMeta(c.stage).label}
                  </span>
                </td>
                <td className="td tnum text-right">{replies}</td>
                <td className="td tnum text-right font-medium">{fmtPoints(points)}</td>
                <td className="td tnum text-xs text-stone-500">{last ? relTime(last) : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="td py-8 text-center text-stone-400">
                  该账号暂无客户
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-stone-400">明细仅列出当前在跟进的客户，账号合计包含已归档会话的消耗。</p>
      </div>
    </Drawer>
  )
}

function MiniKpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card2 px-4 py-3">
      <p className="text-[11px] text-stone-500">{label}</p>
      <p className="tnum mt-0.5 text-lg font-bold">{value}</p>
      {sub && <p className="tnum text-[11px] text-stone-400">{sub}</p>}
    </div>
  )
}

function AgentUsage() {
  const agents = useStore((s) => s.agents)
  const accounts = useStore((s) => s.accounts)
  const aiActions = useStore((s) => s.aiActions)
  const usageMap = useStore((s) => s.billing.agentUsage)
  const total = Object.values(usageMap).reduce((a, u) => a + u.points, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            <th className="th">AI 客服</th>
            <th className="th">托管账号</th>
            <th className="th text-right">回复</th>
            <th className="th text-right">写回 CRM</th>
            <th className="th text-right">转人工</th>
            <th className="th">算力消耗</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {agents.map((g) => {
            const u = usageMap[g.id] ?? { replies: 0, points: 0 }
            const bound = accounts.filter((a) => a.agentId === g.id)
            const acts = aiActions.filter((a) => a.agentId === g.id)
            return (
              <tr key={g.id}>
                <td className="td">
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: g.avatar }}>
                      <Bot size={15} />
                    </span>
                    <span>
                      <span className="flex items-center gap-1.5 font-medium">
                        {g.name}
                        {g.status !== 'active' && <span className="pill-muted">已暂停</span>}
                      </span>
                      <span className="block text-[11px] text-stone-400">
                        {g.platform} · {g.role}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="td text-xs text-stone-600">{bound.length ? bound.map((a) => a.name).join('、') : <span className="text-stone-400">未绑定</span>}</td>
                <td className="td tnum text-right">{u.replies.toLocaleString()}</td>
                <td className="td tnum text-right">{acts.filter((a) => a.type !== 'handoff' && a.status === 'applied').length}</td>
                <td className="td tnum text-right">{acts.filter((a) => a.type === 'handoff').length}</td>
                <td className="td w-[220px]">
                  <div className="flex items-center justify-between text-xs">
                    <b className="tnum">{fmtPoints(u.points)}</b>
                    <span className="tnum text-stone-400">{fmtUsd(pointsToUsd(u.points))}</span>
                  </div>
                  <div className="mt-1">
                    <Bar value={u.points} max={total} className="bg-ai" />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Trend() {
  const usageDaily = useStore((s) => s.usageDaily)
  const usage = useStore((s) => s.usage)
  const contacts = useStore((s) => s.contacts)
  const agents = useStore((s) => s.agents)
  const members = useMembers()
  const maxDay = Math.max(1, ...usageDaily.map((d) => d.ai + d.translate))

  return (
    <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">近 14 天算力消耗</p>
          <span className="flex items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-ai" /> AI 回复 / 助手
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-info/60" /> 翻译
            </span>
          </span>
        </div>
        <div className="mt-4 flex h-52 items-end gap-1.5">
          {usageDaily.map((d, i) => {
            const total = d.ai + d.translate
            const today = i === usageDaily.length - 1
            return (
              <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${new Date(d.date).toLocaleDateString('zh-CN')} · ${fmtPoints(total)} 点`}>
                <div className="flex flex-col overflow-hidden rounded-t-[3px]" style={{ height: `${(total / maxDay) * 100}%` }}>
                  <div className="bg-info/60" style={{ height: `${(d.translate / Math.max(1, total)) * 100}%` }} />
                  <div className={clsx('flex-1', today ? 'bg-ai/60' : 'bg-ai')} />
                </div>
                <span className={clsx('mt-1.5 text-center text-[10px]', today ? 'font-medium text-ink' : 'text-stone-400')}>{today ? '今天' : new Date(d.date).getDate()}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">最近扣费</p>
        <div className="mt-2 divide-y divide-divider rounded-xl border border-border">
          {usage.slice(0, 12).map((r) => {
            const ct = contacts.find((c) => c.id === r.contactId)
            const ag = agents.find((a) => a.id === r.agentId)
            const mb = members.find((m) => m.id === r.memberId)
            const icon =
              r.kind === 'ai_reply' ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ai-bg text-ai">
                  <Bot size={14} />
                </span>
              ) : r.kind === 'ai_assist' ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ai-bg text-ai">
                  <Wand2 size={14} />
                </span>
              ) : mb ? (
                <Avatar name={mb.name} color={mb.color} size={28} />
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                  <Languages size={14} />
                </span>
              )
            const label = r.kind === 'ai_reply' ? `${ag?.name ?? 'AI'} 自动回复` : r.kind === 'ai_assist' ? `${mb?.name ?? '成员'} 使用 AI 助手` : `${mb?.name ?? '成员'} 发送翻译`
            return (
              <div key={r.id} className="flex items-center gap-2.5 px-3 py-2.5 text-[13px]">
                {icon}
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    {label}
                    <span className="text-stone-400"> · {ct?.name}</span>
                  </p>
                  <p className="tnum text-[11px] text-stone-400">{dateTime(r.time)}</p>
                </div>
                <span className="tnum font-medium text-stone-600">−{fmtPoints(r.points)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Orders() {
  const orders = useStore((s) => s.orders)
  const { confirmOrder } = useStore()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            <th className="th">订单号</th>
            <th className="th">购买内容</th>
            <th className="th">数量</th>
            <th className="th text-right">金额</th>
            <th className="th">支付方式</th>
            <th className="th">状态</th>
            <th className="th">创建时间</th>
            <th className="th">处理结果</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {orders.map((o) => {
            const st = ORDER_STATUS[o.status]
            return (
              <tr key={o.id} className="hover:bg-stone-50/60">
                <td className="td font-mono text-xs">{o.id}</td>
                <td className="td">
                  <span className="flex items-center gap-2 font-medium">
                    <span className={clsx('flex h-6 w-6 items-center justify-center rounded-md', o.kind === 'points' ? 'bg-info/10 text-info' : 'bg-line/10 text-line')}>
                      {o.kind === 'points' ? <Cpu size={13} /> : o.kind === 'upgrade' ? <Crown size={13} /> : <Users size={13} />}
                    </span>
                    {ORDER_KIND_LABEL[o.kind]}
                  </span>
                </td>
                <td className="td tnum">{orderQty(o)}</td>
                <td className="td tnum text-right font-semibold">{fmtUsd(o.amountUsd)}</td>
                <td className="td text-xs text-stone-500">{PAY_METHODS.find((p) => p.key === o.method)?.label}</td>
                <td className="td">
                  <span className={st.cls}>
                    <st.icon size={11} /> {st.label}
                  </span>
                </td>
                <td className="td tnum text-xs text-stone-500">{dateTime(o.createdAt)}</td>
                <td className="td text-xs">
                  {o.status === 'pending' && (
                    <span className="flex items-center gap-2">
                      <span className="text-stone-400">等待平台确认</span>
                      <Button size="sm" variant="soft" onClick={() => confirmOrder(o.id)}>
                        演示：确认到账
                      </Button>
                    </span>
                  )}
                  {o.status === 'done' && <span className="tnum text-stone-400">{o.doneAt ? `${dateTime(o.doneAt)} 到账` : '已到账'}</span>}
                  {o.status === 'rejected' && <span className="text-danger">未收到款项，订单已关闭</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Pricing() {
  const billing = useStore((s) => s.billing)
  const { openBilling } = useStore()
  const plan = PLANS[billing.plan]
  return (
    <div className="p-5">
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(PLANS) as PlanKey[]).map((k) => {
          const p = PLANS[k]
          const current = k === billing.plan
          const higher = p.seatUsd > plan.seatUsd
          return (
            <div key={k} className={clsx('flex flex-col rounded-2xl border p-5', current ? 'border-line bg-line/5 ring-1 ring-line/30' : 'border-border')}>
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold">{p.name}</p>
                {current && <Badge className="pill-on">当前</Badge>}
              </div>
              <p className="mt-1 text-xs text-stone-500">{p.desc}</p>
              <p className="mt-4">
                <span className="tnum text-3xl font-extrabold">${p.seatUsd}</span>
                <span className="text-[13px] text-stone-500"> / 席 / 月</span>
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {p.agents} · {p.members}
              </p>
              <ul className="mt-4 space-y-1.5 text-[13px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0 text-line" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-5">
                {current ? (
                  <Button className="w-full" onClick={() => openBilling('renew')}>
                    续费
                  </Button>
                ) : higher ? (
                  <Button variant="primary" className="w-full" onClick={() => openBilling('upgrade')}>
                    升级到{p.name}
                  </Button>
                ) : (
                  <Button className="w-full" disabled>
                    到期后可降级
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-card2 p-4 text-[13px] md:grid-cols-4">
        <PriceItem icon={<Cpu size={13} />} label="算力兑换" value={`1 美元 ≈ ${fmtPoints(PRICING.pointsPerUsd)} 算力点`} />
        <PriceItem icon={<Bot size={13} />} label="AI 自动回复 / AI 助手" value={`${fmtPoints(PRICING.replyPoints)} 点/次 ≈ ${fmtUsd(pointsToUsd(PRICING.replyPoints))}`} />
        <PriceItem icon={<Languages size={13} />} label="人工消息翻译" value={`${PRICING.translatePoints} 点/条 ≈ ${fmtUsd(pointsToUsd(PRICING.translatePoints))}`} />
        <PriceItem icon={<Sparkles size={13} />} label="充值赠送" value="$50 送 5% · $100 送 10% · $500 送 15%" />
      </div>
    </div>
  )
}

function PriceItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-stone-500">
        {icon} {label}
      </p>
      <p className="tnum mt-0.5 font-medium">{value}</p>
    </div>
  )
}
