import { useEffect, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Plus, Bot, Globe, MessageSquare, Users, MoreHorizontal, RefreshCw, Power, Trash2, ShieldAlert, Flame, CheckCircle2 } from 'lucide-react'
import { useStore, useMembers } from '../store'
import { CHANNELS, relTime } from '../lib/meta'
import type { Channel, ChannelAccount } from '../types'
import { Badge, Button, ChannelIcon, Field, Modal, PageHeader, Ring, Segmented } from '../components/ui'

const STATUS: Record<ChannelAccount['status'], { label: string; cls: string }> = {
  online: { label: '在线', cls: 'bg-brand-50 text-brand-700' },
  warming: { label: '养号中', cls: 'bg-amber-50 text-amber-700' },
  offline: { label: '离线', cls: 'bg-stone-100 text-stone-500' },
  banned: { label: '已封禁', cls: 'bg-red-50 text-red-600' },
}

export default function Accounts() {
  const accounts = useStore((s) => s.accounts)
  const agents = useStore((s) => s.agents)
  const seats = useStore((s) => s.billing.seats)
  const { updateAccount, removeAccount, toast, openBilling } = useStore()
  const members = useMembers()
  const [ch, setCh] = useState<Channel | 'all'>('all')
  const [menu, setMenu] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const list = accounts.filter((a) => ch === 'all' || a.channel === ch)
  const online = accounts.filter((a) => a.status === 'online').length
  const banned = accounts.filter((a) => a.status === 'banned').length

  return (
    <>
      <PageHeader
        title="账号矩阵"
        desc="集中管理所有 WhatsApp / LINE / Telegram / Messenger 账号。每个账号占 1 个席位，独立代理 IP 和设备环境，健康分过低时系统会自动降低发送频率。"
        actions={
          <>
            <span className={clsx('pill', accounts.length >= seats ? 'bg-red-50 text-red-600 ring-red-600/20' : 'bg-stone-50 text-stone-600 ring-stone-200')}>
              <Users size={11} /> 席位 {accounts.length} / {seats}
            </span>
            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                if (accounts.length >= seats) {
                  toast(`席位已用完（${accounts.length}/${seats}），请先增购席位`, 'warn')
                  openBilling('seats')
                  return
                }
                setAdding(true)
              }}
            >
              添加账号
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<Channel | 'all'>
          value={ch}
          onChange={setCh}
          items={[{ key: 'all', label: `全部 ${accounts.length}` }, ...(Object.keys(CHANNELS) as Channel[]).map((c) => ({ key: c, label: `${CHANNELS[c].label} ${accounts.filter((a) => a.channel === c).length}` }))]}
        />
        <span className="text-[13px] text-stone-500">
          在线 <b className="tnum text-brand-700">{online}</b> · 封禁 <b className="tnum text-red-600">{banned}</b>
        </span>
      </div>

      {banned > 0 && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-[13px] text-red-700">
          <ShieldAlert size={16} />
          <span className="flex-1">
            有 {banned} 个账号被封禁，其中的客户已自动标记，可以在「客户管理」里筛选后用其他账号重新触达。
          </span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => {
          const agent = agents.find((g) => g.id === a.agentId)
          const owner = members.find((m) => m.id === a.ownerId)
          return (
            <div key={a.id} className={clsx('card relative p-4', a.status === 'banned' && 'opacity-80')}>
              <div className="flex items-start gap-3">
                <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', CHANNELS[a.channel].bg)}>
                  <ChannelIcon channel={a.channel} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{a.name}</p>
                    <Badge className={STATUS[a.status].cls}>{STATUS[a.status].label}</Badge>
                  </div>
                  <p className="tnum mt-0.5 truncate text-xs text-stone-500">{a.handle}</p>
                </div>
                <div className="text-center">
                  <Ring value={a.health} size={42} />
                  <p className="text-[10px] text-stone-400">健康分</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-stone-50 py-2">
                  <p className="tnum text-[13px] font-semibold">{a.todayChats}</p>
                  <p className="flex items-center justify-center gap-0.5 text-[11px] text-stone-400"><MessageSquare size={10} /> 今日会话</p>
                </div>
                <div className="rounded-lg bg-stone-50 py-2">
                  <p className="tnum text-[13px] font-semibold">{a.friends.toLocaleString()}</p>
                  <p className="flex items-center justify-center gap-0.5 text-[11px] text-stone-400"><Users size={10} /> 好友</p>
                </div>
                <div className="rounded-lg bg-stone-50 py-2">
                  <p className="text-[13px] font-semibold">{relTime(a.createdAt).replace('前', '')}</p>
                  <p className="text-[11px] text-stone-400">号龄</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-[13px]">
                <p className="flex items-center gap-2 text-stone-600">
                  <Globe size={13} className="text-stone-400" /> 代理 <span className="font-mono text-xs">{a.proxy}</span> · {a.proxyRegion}
                </p>
                <div className="flex items-center gap-2 text-stone-600">
                  <Bot size={13} className="text-stone-400" /> AI 客服
                  <select
                    value={a.agentId ?? ''}
                    disabled={a.status === 'banned'}
                    onChange={(e) => {
                      updateAccount(a.id, { agentId: e.target.value || null })
                      toast(e.target.value ? `已绑定 ${agents.find((g) => g.id === e.target.value)?.name}` : '已解绑 AI 客服，新消息将由人工处理', 'info')
                    }}
                    className="rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[13px] font-medium text-ink hover:border-stone-200 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">不使用 AI</option>
                    {agents.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} · {g.role}
                      </option>
                    ))}
                  </select>
                  {agent?.status === 'paused' && <span className="text-xs text-amber-600">已暂停</span>}
                </div>
                <p className="text-xs text-stone-400">负责人 {owner?.name}</p>
              </div>
              {a.status === 'warming' && (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <p className="flex items-center gap-1 font-medium"><Flame size={12} /> 新号养号第 6 / 14 天</p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-amber-100"><div className="h-full w-[43%] rounded-full bg-amber-500" /></div>
                  <p className="mt-1">期间每日主动发送上限 30 条，群发功能已锁定</p>
                </div>
              )}
              <button onClick={() => setMenu(menu === a.id ? null : a.id)} className="absolute bottom-3 right-3 rounded-md p-1 text-stone-400 hover:bg-stone-100" aria-label="更多">
                <MoreHorizontal size={16} />
              </button>
              {menu === a.id && (
                <div className="absolute bottom-10 right-3 z-10 w-40 animate-pop-in rounded-xl border border-stone-200 bg-white p-1 shadow-pop">
                  <MenuItem icon={<RefreshCw size={13} />} onClick={() => { toast('正在重新登录…', 'info'); setMenu(null) }}>重新登录</MenuItem>
                  <MenuItem icon={<Globe size={13} />} onClick={() => { toast('代理连通正常 · 延迟 142ms'); setMenu(null) }}>测试代理</MenuItem>
                  <MenuItem icon={<Power size={13} />} onClick={() => { updateAccount(a.id, { status: a.status === 'offline' ? 'online' : 'offline' }); setMenu(null) }}>{a.status === 'offline' ? '上线' : '下线'}</MenuItem>
                  <MenuItem danger icon={<Trash2 size={13} />} onClick={() => { removeAccount(a.id); toast('账号已移除', 'info'); setMenu(null) }}>移除账号</MenuItem>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AddAccount open={adding} onClose={() => setAdding(false)} />
    </>
  )
}

function MenuItem({ icon, children, onClick, danger }: { icon: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={clsx('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]', danger ? 'text-red-600 hover:bg-red-50' : 'hover:bg-stone-50')}>
      {icon}
      {children}
    </button>
  )
}

function AddAccount({ open, onClose }: { open: boolean; onClose: () => void }) {
  const agents = useStore((s) => s.agents)
  const { addAccount, toast } = useStore()
  const [step, setStep] = useState<'form' | 'scan' | 'done'>('form')
  const [form, setForm] = useState({ channel: 'whatsapp' as Channel, name: '', proxyRegion: '墨西哥城', agentId: 'ag1' })

  useEffect(() => {
    if (open) setStep('form')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="添加账号"
      width={480}
      footer={
        step === 'form' ? (
          <>
            <Button onClick={onClose}>取消</Button>
            <Button variant="primary" disabled={!form.name} onClick={() => setStep('scan')}>
              下一步：扫码登录
            </Button>
          </>
        ) : step === 'scan' ? (
          <>
            <Button onClick={() => setStep('form')}>上一步</Button>
            <Button
              variant="primary"
              onClick={() => {
                addAccount({ channel: form.channel, name: form.name, handle: '+52 55 0000 ' + Math.floor(1000 + Math.random() * 8999), status: 'warming', proxy: 'res-auto-' + Math.floor(100 + Math.random() * 899), proxyRegion: form.proxyRegion, agentId: form.agentId || null, ownerId: 'm1' })
                setStep('done')
              }}
            >
              演示：模拟扫码成功
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              onClose()
              toast('账号已添加，进入 14 天养号期')
            }}
          >
            完成
          </Button>
        )
      }
    >
      {step === 'form' && (
        <div className="space-y-4">
          <Field label="渠道">
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(CHANNELS) as Channel[]).map((c) => (
                <button key={c} onClick={() => setForm({ ...form, channel: c })} className={clsx('flex flex-col items-center gap-1 rounded-lg border py-2.5 text-xs', form.channel === c ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:bg-stone-50')}>
                  <ChannelIcon channel={c} size={18} />
                  {CHANNELS[c].label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="账号备注名">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="例如：拉美批发-03" />
          </Field>
          <Field label="代理 IP 地区" hint="建议与手机号归属国一致，系统会自动分配住宅 IP">
            <select value={form.proxyRegion} onChange={(e) => setForm({ ...form, proxyRegion: e.target.value })} className="input">
              {['墨西哥城', '圣保罗', '利雅得', '雅加达', '东京', '曼谷', '法兰克福', '洛杉矶'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="绑定 AI 客服">
            <select value={form.agentId} onChange={(e) => setForm({ ...form, agentId: e.target.value })} className="input">
              <option value="">暂不绑定</option>
              {agents.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.role}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {step === 'scan' && (
        <div className="flex flex-col items-center py-2 text-center">
          <div className="rounded-2xl border border-stone-200 p-3">
            <svg width="176" height="176" viewBox="0 0 29 29" shapeRendering="crispEdges">
              <rect width="29" height="29" fill="#fff" />
              {Array.from({ length: 29 * 29 }).map((_, i) => {
                const x = i % 29
                const y = Math.floor(i / 29)
                const finder = (x < 7 && y < 7) || (x > 21 && y < 7) || (x < 7 && y > 21)
                if (finder) {
                  const fx = x > 21 ? x - 22 : x
                  const fy = y > 21 ? y - 22 : y
                  const on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4)
                  return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#1c1a17" /> : null
                }
                return (x * 7 + y * 13 + x * y) % 3 === 0 ? <rect key={i} x={x} y={y} width="1" height="1" fill="#1c1a17" /> : null
              })}
            </svg>
          </div>
          <p className="mt-4 font-medium">用手机 {CHANNELS[form.channel].label} 扫码</p>
          <p className="mt-1 max-w-xs text-xs text-stone-500">打开 {CHANNELS[form.channel].label} → 设置 → 已关联的设备 → 关联新设备。二维码 60 秒后刷新。</p>
        </div>
      )}
      {step === 'done' && (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 size={40} className="text-brand-600" />
          <p className="mt-3 font-medium">{form.name} 登录成功</p>
          <p className="mt-1 max-w-xs text-xs text-stone-500">新号会先进入 14 天养号期：自动模拟正常聊天，限制群发，逐步提高发送上限，降低被封风险。</p>
        </div>
      )}
    </Modal>
  )
}
