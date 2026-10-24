import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Check, Clock3, Minus, Plus, QrCode } from 'lucide-react'
import { useStore } from '../store'
import {
  PAY_METHODS,
  PLANS,
  POINT_PACKS,
  PRICING,
  RENEW_OPTIONS,
  daysLeft,
  fmtPoints,
  fmtUsd,
  seatProrateUsd,
  usdToCny,
} from '../lib/billing'
import { dateTime } from '../lib/meta'
import type { Order, PayMethod, PlanKey } from '../types'
import { Button, Modal } from './ui'

const TITLES = { seats: '增购席位', renew: '套餐续费', points: '充值算力', upgrade: '升级套餐' } as const

export function BillingCheckout() {
  const modal = useStore((s) => s.billingModal)
  const billing = useStore((s) => s.billing)
  const accounts = useStore((s) => s.accounts)
  const { openBilling, createOrder, confirmOrder } = useStore()
  const nav = useNavigate()

  const [seats, setSeats] = useState(1)
  const [months, setMonths] = useState(3)
  const [pack, setPack] = useState(1)
  const [customUsd, setCustomUsd] = useState('')
  const [plan, setPlan] = useState<PlanKey>('enterprise')
  const [method, setMethod] = useState<PayMethod>('wechat')
  const [doneId, setDoneId] = useState<string | null>(null)

  useEffect(() => {
    if (!modal) return
    setSeats(Math.max(1, accounts.length - billing.seats + 1))
    setMonths(3)
    setPack(1)
    setCustomUsd('')
    setPlan(billing.plan === 'enterprise' ? 'enterprise' : billing.plan === 'pro' ? 'enterprise' : 'pro')
    setMethod('wechat')
    setDoneId(null)
  }, [modal])

  if (!modal) return null
  const close = () => openBilling(null)
  const cur = PLANS[billing.plan]
  const left = daysLeft(billing.expiresAt)

  let amount = 0
  let summary = ''
  let order: Omit<Order, 'id' | 'status' | 'createdAt'> | null = null

  if (modal === 'seats') {
    amount = seatProrateUsd(seats, cur.seatUsd, billing.expiresAt)
    summary = `${seats} 个席位 · 与现有席位同日到期`
    order = { kind: 'seats', seats, amountUsd: amount, method }
  } else if (modal === 'renew') {
    const opt = RENEW_OPTIONS.find((o) => o.months === months)!
    amount = Math.round(billing.seats * cur.seatUsd * months * (1 - opt.discount) * 100) / 100
    summary = `${cur.name} ${billing.seats} 席 × ${months} 个月`
    order = { kind: 'renew', months, amountUsd: amount, method }
  } else if (modal === 'points') {
    const usd = pack === -1 ? Math.max(0, Math.floor(Number(customUsd) || 0)) : POINT_PACKS[pack].usd
    const bonus = pack === -1 ? 0 : POINT_PACKS[pack].bonus
    const points = Math.round(usd * PRICING.pointsPerUsd * (1 + bonus))
    amount = usd
    summary = `${fmtPoints(points)} 算力点${bonus ? `（含赠送 ${bonus * 100}%）` : ''}`
    order = { kind: 'points', points, amountUsd: usd, method }
  } else {
    const diff = PLANS[plan].seatUsd - cur.seatUsd
    amount = Math.max(0, Math.round(billing.seats * diff * (left / 30) * 100) / 100)
    summary = `${cur.name} → ${PLANS[plan].name}，补差价 ${billing.seats} 席 × ${left} 天`
    order = { kind: 'upgrade', plan, amountUsd: amount, method }
  }

  const pay = PAY_METHODS.find((p) => p.key === method)!

  if (doneId) {
    return (
      <Modal
        open
        onClose={close}
        title="订单已提交"
        width={440}
        footer={
          <>
            <Button
              onClick={() => {
                close()
                nav('/billing')
              }}
            >
              查看订单
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                confirmOrder(doneId)
                close()
              }}
            >
              演示：模拟平台确认到账
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center py-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock3 size={24} />
          </span>
          <p className="mt-3 font-semibold">等待平台确认到账</p>
          <p className="mt-1 text-[13px] text-stone-500">
            订单号 <span className="font-mono">{doneId}</span> · {summary}
          </p>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-stone-400">
            微信 / 支付宝通常 1 分钟内自动到账；USDT 需等待链上 19 个区块确认。正式版接入支付回调后无需人工确认。
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={close}
      title={TITLES[modal]}
      width={560}
      footer={
        <>
          <span className="mr-auto text-xs text-stone-400">付款即代表同意《LinkPilot 服务协议》</span>
          <Button onClick={close}>取消</Button>
          <Button
            variant="primary"
            disabled={amount <= 0}
            onClick={() => {
              if (!order) return
              setDoneId(createOrder({ ...order, method }))
            }}
          >
            我已完成支付
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {modal === 'seats' && (
          <div>
            <p className="label">席位数量</p>
            <div className="flex items-center gap-3">
              <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40" disabled={seats <= 1} onClick={() => setSeats((v) => Math.max(1, v - 1))} aria-label="减少">
                <Minus size={15} />
              </button>
              <input className="input tnum w-24 text-center" type="number" min={1} value={seats} onChange={(e) => setSeats(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
              <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-stone-200 text-stone-500 hover:bg-stone-50" onClick={() => setSeats((v) => v + 1)} aria-label="增加">
                <Plus size={15} />
              </button>
              <span className="text-[13px] text-stone-500">
                {fmtUsd(cur.seatUsd)} / 席 / 月
              </span>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              当前 {billing.seats} 席，已占用 {accounts.length} 席。新席位按剩余 <b className="text-ink">{left}</b> 天折算，与现有席位 {dateTime(billing.expiresAt).split(' ')[0]} 同日到期。
            </p>
          </div>
        )}

        {modal === 'renew' && (
          <div>
            <p className="label">续费时长</p>
            <div className="grid grid-cols-4 gap-2">
              {RENEW_OPTIONS.map((o) => (
                <OptionCard key={o.months} active={months === o.months} onClick={() => setMonths(o.months)}>
                  <p className="font-semibold">{o.months} 个月</p>
                  <p className={clsx('mt-0.5 text-xs', o.discount ? 'text-brand-700' : 'text-stone-400')}>{o.discount ? `${Math.round((1 - o.discount) * 100) / 10} 折` : '原价'}</p>
                </OptionCard>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">
              {cur.name} · {billing.seats} 席 · {fmtUsd(cur.seatUsd)} / 席 / 月，续费后到期日顺延。
            </p>
          </div>
        )}

        {modal === 'points' && (
          <div>
            <p className="label">充值金额</p>
            <div className="grid grid-cols-4 gap-2">
              {POINT_PACKS.map((p, i) => (
                <OptionCard key={p.usd} active={pack === i} onClick={() => setPack(i)}>
                  <p className="tnum font-semibold">${p.usd}</p>
                  <p className="tnum mt-0.5 text-[11px] text-stone-500">{fmtPoints(p.usd * PRICING.pointsPerUsd * (1 + p.bonus))} 点</p>
                  {p.bonus > 0 && <span className="pill-ai absolute -top-2 right-1.5 px-1.5 py-0 text-[10px]">送 {p.bonus * 100}%</span>}
                </OptionCard>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                className={clsx('input tnum w-40', pack === -1 && 'border-brand-500')}
                placeholder="自定义金额（美元）"
                value={customUsd}
                onFocus={() => setPack(-1)}
                onChange={(e) => setCustomUsd(e.target.value.replace(/\D/g, ''))}
              />
              <span className="text-xs text-stone-500">
                $1 = {fmtPoints(PRICING.pointsPerUsd)} 点 · AI 回复 {fmtPoints(PRICING.replyPoints)} 点/条 · 翻译 {PRICING.translatePoints} 点/条
              </span>
            </div>
            <p className="mt-2 text-xs text-stone-500">当前余额 {fmtPoints(billing.points)} 点，算力永久有效，不随套餐到期清零。</p>
          </div>
        )}

        {modal === 'upgrade' && (
          <div>
            <p className="label">目标套餐</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PLANS) as PlanKey[]).map((k) => {
                const lower = PLANS[k].seatUsd <= cur.seatUsd
                return (
                  <OptionCard key={k} active={plan === k} disabled={lower} onClick={() => setPlan(k)}>
                    <p className="font-semibold">{PLANS[k].name}</p>
                    <p className="tnum mt-0.5 text-xs text-stone-500">{fmtUsd(PLANS[k].seatUsd)} / 席 / 月</p>
                    {k === billing.plan && <p className="mt-1 text-[11px] text-brand-700">当前套餐</p>}
                  </OptionCard>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-stone-500">升级立即生效，按剩余 {left} 天补差价，到期日不变。</p>
          </div>
        )}

        <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[13px] text-stone-500">应付金额</p>
            <p className="mt-0.5 truncate text-xs text-stone-400">{summary}</p>
          </div>
          <div className="text-right">
            <p className="tnum text-xl font-bold text-brand-700">{method === 'usdt' ? `${amount.toFixed(2)} USDT` : usdToCny(amount)}</p>
            <p className="tnum text-[11px] text-stone-400">{method === 'usdt' ? `≈ ${usdToCny(amount)}` : `≈ ${fmtUsd(amount)}`}</p>
          </div>
        </div>

        <div>
          <p className="label">支付方式</p>
          <div className="grid grid-cols-3 gap-2">
            {PAY_METHODS.map((p) => (
              <OptionCard key={p.key} active={method === p.key} onClick={() => setMethod(p.key)}>
                <p className="text-[13px] font-medium">{p.label}</p>
              </OptionCard>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-stone-200 p-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-stone-200" style={{ color: pay.color }}>
            <QrCode size={64} strokeWidth={1.2} />
          </div>
          <div className="min-w-0 text-[13px]">
            <p className="font-medium" style={{ color: pay.color }}>
              {pay.label}
            </p>
            <p className="mt-1 text-stone-500">{pay.hint}</p>
            {method === 'usdt' && <p className="mt-1.5 text-xs text-stone-400">收款地址和实时汇率由计费服务按订单生成，转账金额需与订单完全一致。</p>}
            <p className="mt-1.5 text-xs text-stone-400">支付完成后点击「我已完成支付」，到账后席位 / 算力自动生效。</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function OptionCard({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'relative rounded-[10px] border px-3 py-2.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        active ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/30' : 'border-stone-200 hover:bg-stone-50',
      )}
    >
      {active && (
        <span className="absolute left-1.5 top-1.5 text-brand-600">
          <Check size={12} />
        </span>
      )}
      {children}
    </button>
  )
}
