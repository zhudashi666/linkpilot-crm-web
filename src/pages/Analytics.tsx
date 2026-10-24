import { useState } from 'react'
import clsx from 'clsx'
import { useStore, useMembers } from '../store'
import { STAGES, money } from '../lib/meta'
import { Avatar, Bar, PageHeader, Segmented, Stat } from '../components/ui'

const DAYS = ['10/18', '10/19', '10/20', '10/21', '10/22', '10/23', '10/24']
const TREND = [
  { ai: 212, human: 61 },
  { ai: 248, human: 58 },
  { ai: 231, human: 72 },
  { ai: 276, human: 66 },
  { ai: 302, human: 70 },
  { ai: 289, human: 59 },
  { ai: 318, human: 64 },
]

const FUNNEL = [
  { label: '分流链接点击', value: 16721 },
  { label: '添加好友', value: 3334 },
  { label: 'AI 接待并识别需求', value: 1862 },
  { label: '进入报价', value: 412 },
  { label: '成交', value: 97 },
]

export default function Analytics() {
  const contacts = useStore((s) => s.contacts)
  const links = useStore((s) => s.links)
  const agents = useStore((s) => s.agents)
  const members = useMembers()
  const [range, setRange] = useState<'7' | '30' | '90'>('7')
  const max = Math.max(...TREND.map((t) => t.ai + t.human))

  return (
    <>
      <PageHeader title="数据分析" desc="从广告点击到成交的完整漏斗，以及 AI 与人工的接待效果对比。" actions={<Segmented value={range} onChange={setRange} items={[{ key: '7', label: '近 7 天' }, { key: '30', label: '近 30 天' }, { key: '90', label: '近 90 天' }]} />} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="新增客户" value="3,334" sub="环比 +12.4%" tone="up" />
        <Stat label="接待会话" value="2,326" sub="环比 +8.9%" tone="up" />
        <Stat label="AI 独立解决率" value="81.6%" sub="环比 +3.2pt" tone="up" />
        <Stat label="平均首次响应" value="6.4 秒" sub="人工平均 4 分 12 秒" />
        <Stat label="成交金额" value="$268,940" sub="环比 −4.1%" tone="down" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="font-semibold">获客转化漏斗</h3>
          <p className="mb-4 text-xs text-stone-500">每一层相对上一层的转化率</p>
          <div className="space-y-2.5">
            {FUNNEL.map((f, i) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[13px] text-stone-600">{f.label}</span>
                <div className="relative h-8 flex-1">
                  <div className="h-full rounded-md bg-brand-500/90" style={{ width: `${Math.max(4, (f.value / FUNNEL[0].value) * 100)}%`, opacity: 1 - i * 0.14 }} />
                  <span className="tnum absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-white mix-blend-normal">{f.value.toLocaleString()}</span>
                </div>
                <span className="tnum w-14 shrink-0 text-right text-xs text-stone-500">{i === 0 ? '' : ((f.value / FUNNEL[i - 1].value) * 100).toFixed(1) + '%'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">每日接待量</h3>
              <p className="mb-4 text-xs text-stone-500">AI 接待与人工接待的会话数</p>
            </div>
            <div className="flex gap-3 text-xs text-stone-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand-500" /> AI</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-400" /> 人工</span>
            </div>
          </div>
          <div className="flex h-[190px] items-end gap-3 border-b border-stone-200 pb-px">
            {TREND.map((t, i) => (
              <div key={i} className="group relative flex flex-1 flex-col justify-end" style={{ height: '100%' }}>
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[11px] text-white group-hover:block">
                  AI {t.ai} · 人工 {t.human}
                </div>
                <div className="rounded-t-[3px] bg-blue-400" style={{ height: `${(t.human / max) * 100}%` }} />
                <div className="bg-brand-500" style={{ height: `${(t.ai / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-3">
            {DAYS.map((d) => (
              <span key={d} className="tnum flex-1 text-center text-[11px] text-stone-400">{d}</span>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h3 className="mb-4 font-semibold">客户来源效果</h3>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-xs text-stone-500">
                <th className="pb-2 text-left font-medium">来源</th>
                <th className="pb-2 text-right font-medium">新增好友</th>
                <th className="pb-2 text-right font-medium">成交</th>
                <th className="pb-2 text-right font-medium">成交额</th>
                <th className="pb-2 text-right font-medium">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {links.map((l, i) => (
                <tr key={l.id}>
                  <td className="py-2.5">{l.name}</td>
                  <td className="tnum py-2.5 text-right">{l.newContacts.toLocaleString()}</td>
                  <td className="tnum py-2.5 text-right">{[38, 27, 9, 14][i] ?? 0}</td>
                  <td className="tnum py-2.5 text-right">{money([112400, 41380, 18200, 42400][i] ?? 0)}</td>
                  <td className={clsx('tnum py-2.5 text-right font-medium', i === 2 ? 'text-red-500' : 'text-brand-700')}>{['6.8x', '3.1x', '0.9x', '11.2x'][i] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-5">
          <h3 className="mb-4 font-semibold">AI 客服 vs 人工</h3>
          <div className="space-y-4">
            {agents.map((a) => (
              <div key={a.id}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-medium">{a.name} <span className="font-normal text-stone-400">· {a.role}</span></span>
                  <span className="tnum text-xs text-stone-500">接待 {a.stats.receptions.toLocaleString()} · 转化 {a.stats.conversion}%</span>
                </div>
                <Bar value={a.stats.autoRate} max={100} />
              </div>
            ))}
            <div className="border-t border-stone-100 pt-3">
              <p className="mb-2 text-xs text-stone-500">人工销售（本周）</p>
              <div className="space-y-2">
                {members.filter((m) => m.role === '销售' || m.role === '销售主管').map((m) => {
                  const mine = contacts.filter((c) => c.ownerId === m.id)
                  const won = mine.filter((c) => c.stage === 'won').reduce((s, c) => s + c.dealValue, 0)
                  return (
                    <div key={m.id} className="flex items-center gap-2 text-[13px]">
                      <Avatar name={m.name} color={m.color} size={22} />
                      <span className="w-16">{m.name}</span>
                      <span className="tnum text-xs text-stone-500">客户 {mine.length}</span>
                      <span className="tnum ml-auto font-medium">{money(won)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">销售阶段分布</h3>
          <div className="flex h-9 overflow-hidden rounded-lg">
            {STAGES.map((s) => {
              const n = contacts.filter((c) => c.stage === s.key).length
              if (!n) return null
              return (
                <div key={s.key} className={clsx('flex items-center justify-center text-xs font-medium text-white', s.dot)} style={{ flex: n }} title={`${s.label} ${n}`}>
                  {n}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-500">
            {STAGES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span className={clsx('h-2 w-2 rounded-full', s.dot)} />
                {s.label} <span className="tnum">{contacts.filter((c) => c.stage === s.key).length}</span>
              </span>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
