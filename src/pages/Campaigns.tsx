import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { Plus, Pause, Play, Sparkles, ShieldCheck, Send, Users, Check, RefreshCw, Copy, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { CHANNELS, STAGES, TAG_POOL, dateTime, T } from '../lib/meta'
import type { Campaign, Channel, Stage } from '../types'
import { Badge, Bar, Button, ChannelIcon, Field, Modal, PageHeader, Stat, Toggle } from '../components/ui'

const STATUS: Record<Campaign['status'], { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-stone-100 text-stone-600' },
  scheduled: { label: '待发送', cls: 'bg-blue-50 text-blue-700' },
  running: { label: '发送中', cls: 'bg-brand-50 text-brand-700' },
  paused: { label: '已暂停', cls: 'bg-amber-50 text-amber-700' },
  done: { label: '已完成', cls: 'bg-stone-100 text-stone-500' },
}

export default function Campaigns() {
  const campaigns = useStore((s) => s.campaigns)
  const { setCampaignStatus, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(params.get('new') === '1')

  const sent = campaigns.reduce((a, c) => a + c.sent, 0)
  const replied = campaigns.reduce((a, c) => a + c.replied, 0)
  const delivered = campaigns.reduce((a, c) => a + c.delivered, 0)

  return (
    <>
      <PageHeader
        title="群发任务"
        desc="按标签、阶段筛选客户批量触达。AI 会把同一条内容改写成多个版本轮换发送，降低被平台判定为垃圾消息的风险。"
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setOpen(true)}>
            新建群发
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="本月发送" value={sent.toLocaleString()} sub="较上月 +18.3%" tone="up" />
        <Stat label="送达率" value={`${((delivered / Math.max(1, sent)) * 100).toFixed(1)}%`} sub="WhatsApp 平均 96.2%" />
        <Stat label="回复率" value={`${((replied / Math.max(1, delivered)) * 100).toFixed(1)}%`} sub="AI 改写版本 +4.7pt" tone="up" />
        <Stat label="带来新商机" value="37" sub={'预估 $86,420'} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px] text-[13px]">
          <thead className="bg-stone-50/80">
            <tr>
              <th className="th">任务</th>
              <th className="th">状态</th>
              <th className="th">受众</th>
              <th className="th w-[200px]">进度</th>
              <th className="th">回复</th>
              <th className="th">AI 版本</th>
              <th className="th">发送时间</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50/60">
                <td className="td">
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                    <ChannelIcon channel={c.channel} size={11} /> {c.audienceDesc}
                  </p>
                </td>
                <td className="td">
                  <Badge className={STATUS[c.status].cls}>
                    {c.status === 'running' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />}
                    {STATUS[c.status].label}
                  </Badge>
                </td>
                <td className="td tnum">{c.audience.toLocaleString()}</td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <Bar value={c.sent} max={c.audience} />
                    <span className="tnum w-14 shrink-0 text-right text-xs text-stone-500">{((c.sent / c.audience) * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="td tnum">
                  {c.replied}
                  {c.delivered > 0 && <span className="ml-1 text-xs text-stone-400">({((c.replied / c.delivered) * 100).toFixed(1)}%)</span>}
                </td>
                <td className="td">{c.variants ? <span className="pill-ai"><Sparkles size={11} /> {c.variants} 个</span> : <span className="text-stone-300">—</span>}</td>
                <td className="td tnum text-stone-500">{dateTime(c.scheduledAt)}</td>
                <td className="td text-right">
                  {c.status === 'running' && (
                    <Button size="sm" icon={<Pause size={12} />} onClick={() => { setCampaignStatus(c.id, 'paused'); toast('已暂停发送', 'info') }}>暂停</Button>
                  )}
                  {(c.status === 'paused' || c.status === 'draft' || c.status === 'scheduled') && (
                    <Button size="sm" icon={<Play size={12} />} onClick={() => { setCampaignStatus(c.id, 'running'); toast('开始发送') }}>{c.status === 'paused' ? '继续' : '立即发送'}</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CampaignWizard
        open={open}
        onClose={() => {
          setOpen(false)
          if (params.get('new')) setParams({})
        }}
      />
    </>
  )
}

const BASE_TEXT = 'Hi {name}! 黑五提前享：SV-2000 储能电源批发价直降 12%，下单满 50 台送 10 块 100W 太阳能板，活动截止 11 月 30 日。'

const VARIANTS = [
  'Hola {name} 👋 Adelanto de Black Friday: la SV-2000 baja 12% en precio mayorista. Por 50 unidades le regalamos 10 paneles de 100W. Válido hasta el 30/11.',
  '{name}, antes que nadie: 12% de descuento mayorista en la estación SV-2000 y 10 paneles solares gratis en pedidos de 50+. ¿Le preparo una cotización?',
  'Buen día {name}. Para nuestros distribuidores: SV-2000 con -12% y paneles de regalo (pedidos desde 50 unidades) hasta fin de noviembre.',
  '¡Hola {name}! Promo exclusiva Black Friday 🔋 SV-2000 -12% + 10 paneles 100W gratis comprando 50. Quedan pocos cupos de producción.',
]

function CampaignWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const contacts = useStore((s) => s.contacts)
  const accounts = useStore((s) => s.accounts)
  const { addCampaign, toast } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('黑五预热 · 批发客户')
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [tags, setTags] = useState<string[]>(['询价-批发'])
  const [stages, setStages] = useState<Stage[]>([])
  const [excludeRecent, setExcludeRecent] = useState(true)
  const [text, setText] = useState(BASE_TEXT)
  const [variants, setVariants] = useState<string[]>([])
  const [genLoading, setGenLoading] = useState(false)
  const [accIds, setAccIds] = useState<string[]>(['a1', 'a2'])
  const [rate, setRate] = useState(6)
  const [jitter, setJitter] = useState(true)
  const [when, setWhen] = useState<'now' | 'later'>('later')
  const [aiTakeover, setAiTakeover] = useState(true)

  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const matched = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.channel === channel &&
          (tags.length === 0 || tags.some((t) => c.tags.includes(t))) &&
          (stages.length === 0 || stages.includes(c.stage)),
      ),
    [contacts, channel, tags, stages],
  )
  const audience = matched.length * 37 + (excludeRecent ? 0 : 52)
  const chAccounts = accounts.filter((a) => a.channel === channel)
  const minutes = Math.ceil(audience / Math.max(1, rate * Math.max(1, accIds.length)))

  const steps = ['选择受众', '编写内容', '发送设置']

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={720}
      title={
        <div className="flex items-center gap-4">
          <span>新建群发</span>
          <div className="flex items-center gap-1.5 text-xs font-normal">
            {steps.map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={clsx('flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold', i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400')}>
                  {i < step ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span className={i === step ? 'text-ink' : 'text-stone-400'}>{s}</span>
                {i < steps.length - 1 && <span className="mx-1 h-px w-4 bg-stone-200" />}
              </span>
            ))}
          </div>
        </div>
      }
      footer={
        <>
          {step > 0 && <Button onClick={() => setStep(step - 1)}>上一步</Button>}
          <div className="flex-1" />
          {step < 2 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)} disabled={step === 0 && audience === 0}>
              下一步
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<Send size={14} />}
              disabled={accIds.length === 0}
              onClick={() => {
                addCampaign({
                  name,
                  channel,
                  audienceDesc: [tags.length ? `标签 ${tags.join('/')}` : '', stages.length ? `阶段 ${stages.map((s) => STAGES.find((x) => x.key === s)!.label).join('/')}` : ''].filter(Boolean).join(' · ') || '全部联系人',
                  audience,
                  status: when === 'now' ? 'running' : 'scheduled',
                  variants: variants.length,
                  ratePerMin: rate,
                  scheduledAt: when === 'now' ? Date.now() : Date.now() + 16 * T.HOUR,
                })
                toast(when === 'now' ? '群发已开始' : '群发已排期，明早 10:00 开始发送')
                onClose()
              }}
            >
              {when === 'now' ? '立即发送' : '确认排期'}
            </Button>
          )}
        </>
      }
    >
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="任务名称">
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </Field>
            <Field label="发送渠道">
              <div className="flex gap-1.5">
                {(['whatsapp', 'line', 'telegram'] as Channel[]).map((c) => (
                  <button key={c} onClick={() => setChannel(c)} className={clsx('flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[13px]', channel === c ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:bg-stone-50')}>
                    <ChannelIcon channel={c} /> {CHANNELS[c].label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="包含任一标签">
            <div className="flex flex-wrap gap-1.5">
              {TAG_POOL.map((t) => (
                <button key={t} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} className={clsx('rounded-lg border px-2 py-1 text-xs', tags.includes(t) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-stone-200 text-stone-600 hover:border-stone-300')}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="销售阶段（不选 = 全部）">
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button key={s.key} onClick={() => setStages((x) => (x.includes(s.key) ? x.filter((y) => y !== s.key) : [...x, s.key]))} className={clsx('flex items-center gap-1 rounded-lg border px-2 py-1 text-xs', stages.includes(s.key) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-stone-200 text-stone-600 hover:border-stone-300')}>
                  <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} /> {s.label}
                </button>
              ))}
            </div>
          </Field>
          <label className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2.5 text-[13px]">
            <span>
              排除 7 天内已被群发过的客户 <span className="text-stone-400">（防止打扰、降低封号风险）</span>
            </span>
            <Toggle checked={excludeRecent} onChange={setExcludeRecent} />
          </label>
          <div className="flex items-center gap-3 rounded-[14px] border border-brand-500/20 bg-brand-50 px-4 py-3">
            <Users size={20} className="text-brand-600" />
            <div>
              <p className="text-[13px] text-stone-600">预计触达</p>
              <p className="tnum text-xl font-semibold">{audience.toLocaleString()} <span className="text-sm font-normal text-stone-500">位客户</span></p>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field label="消息内容（中文撰写，按客户语言自动翻译）" hint="可用变量：{name} 客户名、{company} 公司、{product} 意向产品">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="textarea" />
          </Field>
          <div className="rounded-xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-medium">
                  <Sparkles size={14} className="text-ai" /> AI 多版本改写
                </p>
                <p className="text-xs text-stone-400">每位客户随机收到其中一个版本，并按其母语发送</p>
              </div>
              <Button
                size="sm"
                variant="soft"
                icon={<RefreshCw size={12} className={genLoading ? 'animate-spin' : ''} />}
                onClick={() => {
                  setGenLoading(true)
                  setTimeout(() => {
                    setVariants(VARIANTS)
                    setGenLoading(false)
                  }, 1100)
                }}
              >
                {variants.length ? '重新生成' : '生成 4 个版本'}
              </Button>
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto p-3 scroll-thin">
              {variants.length === 0 && !genLoading && <p className="py-6 text-center text-xs text-stone-400">点击右上角，让 AI 生成不同措辞的版本</p>}
              {genLoading && [0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />)}
              {!genLoading &&
                variants.map((v, i) => (
                  <div key={i} className="group flex gap-2 rounded-lg bg-stone-50 px-3 py-2 text-[13px]">
                    <span className="tnum mt-0.5 text-xs font-semibold text-stone-400">V{i + 1}</span>
                    <p className="flex-1 leading-relaxed">{v}</p>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                      <button className="text-stone-400 hover:text-ink" onClick={() => toast('已复制')}><Copy size={13} /></button>
                      <button className="text-stone-400 hover:text-red-500" onClick={() => setVariants((x) => x.filter((_, j) => j !== i))}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <label className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2.5 text-[13px]">
            <span>
              客户回复后由 AI 客服自动接待 <span className="text-stone-400">（按账号绑定的 AI 客服）</span>
            </span>
            <Toggle checked={aiTakeover} onChange={setAiTakeover} />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <Field label="发送账号（多账号轮流发送，分摊风险）">
            <div className="grid grid-cols-2 gap-2">
              {chAccounts.map((a) => {
                const disabled = a.status === 'banned' || a.status === 'offline'
                const on = accIds.includes(a.id)
                return (
                  <button
                    key={a.id}
                    disabled={disabled}
                    onClick={() => setAccIds((x) => (on ? x.filter((y) => y !== a.id) : [...x, a.id]))}
                    className={clsx('flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] disabled:opacity-40', on ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:bg-stone-50')}
                  >
                    <ChannelIcon channel={a.channel} />
                    <span className="flex-1 truncate">{a.name}</span>
                    <span className={clsx('tnum text-xs', a.health >= 80 ? 'text-brand-600' : a.health >= 50 ? 'text-amber-600' : 'text-red-500')}>
                      {a.status === 'banned' ? '已封禁' : a.status === 'offline' ? '离线' : `健康 ${a.health}`}
                    </span>
                  </button>
                )
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={`每个账号每分钟发送 ${rate} 条`} hint="新号建议 ≤ 5 条/分钟">
              <input type="range" min={1} max={20} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-brand-600" />
            </Field>
            <Field label="发送时间">
              <div className="flex gap-1.5">
                <button onClick={() => setWhen('now')} className={clsx('h-9 flex-1 rounded-lg border text-[13px]', when === 'now' ? 'border-brand-500 bg-brand-50' : 'border-stone-200')}>立即发送</button>
                <button onClick={() => setWhen('later')} className={clsx('h-9 flex-1 rounded-lg border text-[13px]', when === 'later' ? 'border-brand-500 bg-brand-50' : 'border-stone-200')}>客户当地 10:00</button>
              </div>
            </Field>
          </div>
          <label className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2.5 text-[13px]">
            <span>
              随机间隔 + 模拟输入状态 <span className="text-stone-400">（每条间隔 4-15 秒）</span>
            </span>
            <Toggle checked={jitter} onChange={setJitter} />
          </label>
          <div className="flex items-start gap-3 rounded-xl border border-stone-200 px-4 py-3">
            <ShieldCheck size={20} className="mt-0.5 text-brand-600" />
            <div className="text-[13px]">
              <p className="font-medium">风控预估：{rate <= 8 && jitter ? <span className="text-brand-700">低风险</span> : <span className="text-amber-600">中风险</span>}</p>
              <p className="tnum mt-0.5 text-stone-500">
                {audience.toLocaleString()} 位客户 · {accIds.length} 个账号 · 预计 {minutes >= 60 ? `${(minutes / 60).toFixed(1)} 小时` : `${minutes} 分钟`}发完 · 预计消耗 AI 翻译约 {(audience * 0.18).toFixed(0)} 次
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
