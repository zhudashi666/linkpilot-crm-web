import { useState } from 'react'
import clsx from 'clsx'
import { Plus, Copy, QrCode, Link2 } from 'lucide-react'
import { useStore } from '../store'
import { dateTime } from '../lib/meta'
import type { Channel, TrafficLink } from '../types'
import { Button, ChannelIcon, Field, Modal, PageHeader, Stat, Toggle } from '../components/ui'

const STRATEGY: Record<TrafficLink['strategy'], { label: string; desc: string }> = {
  round_robin: { label: '轮流分配', desc: '按顺序把新客户分到每个账号' },
  least_load: { label: '负载最低优先', desc: '优先分给今天接待量最少、健康度最高的账号' },
  weighted: { label: '按权重', desc: '按设置的比例分配' },
}

export default function Links() {
  const links = useStore((s) => s.links)
  const accounts = useStore((s) => s.accounts)
  const { toggleLink, addLink, toast } = useStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ name: string; slug: string; channel: Channel; accountIds: string[]; strategy: TrafficLink['strategy'] }>({
    name: '',
    slug: '',
    channel: 'whatsapp',
    accountIds: [],
    strategy: 'least_load',
  })

  const clicks = links.reduce((a, l) => a + l.clicks, 0)
  const added = links.reduce((a, l) => a + l.newContacts, 0)

  return (
    <>
      <PageHeader
        title="分流链接"
        desc="一个链接背后挂多个账号，广告流量自动分到不同账号，单号压力小、不易被封。每个通过链接进来的客户都会记录来源，后续成交可以追溯到是哪个广告带来的。"
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setOpen(true)}>
            新建链接
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="累计点击" value={clicks.toLocaleString()} />
        <Stat label="新增好友" value={added.toLocaleString()} />
        <Stat label="加好友转化率" value={`${((added / Math.max(1, clicks)) * 100).toFixed(1)}%`} />
        <Stat label="链接带来成交" value="$214,380" sub="近 30 天" tone="up" />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead className="bg-stone-50/80">
            <tr>
              <th className="th">链接</th>
              <th className="th">分配策略</th>
              <th className="th">挂载账号</th>
              <th className="th text-right">点击</th>
              <th className="th text-right">新增好友</th>
              <th className="th text-right">转化率</th>
              <th className="th">启用</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {links.map((l) => {
              const accs = accounts.filter((a) => l.accountIds.includes(a.id))
              const allBad = accs.every((a) => a.status === 'banned' || a.status === 'offline')
              return (
                <tr key={l.id} className="hover:bg-stone-50/60">
                  <td className="td">
                    <p className="flex items-center gap-1.5 font-medium">
                      <ChannelIcon channel={l.channel} size={13} /> {l.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-stone-400">lnkp.to/{l.slug}</p>
                  </td>
                  <td className="td text-stone-600">{STRATEGY[l.strategy].label}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {accs.map((a) => (
                        <span key={a.id} className={clsx('rounded px-1.5 text-xs', a.status === 'banned' ? 'bg-red-50 text-red-600 line-through' : 'bg-stone-100 text-stone-600')}>
                          {a.name}
                        </span>
                      ))}
                    </div>
                    {allBad && <p className="mt-1 text-xs text-red-500">所有账号不可用，流量会丢失</p>}
                  </td>
                  <td className="td tnum text-right">{l.clicks.toLocaleString()}</td>
                  <td className="td tnum text-right">{l.newContacts.toLocaleString()}</td>
                  <td className="td tnum text-right">{l.clicks ? ((l.newContacts / l.clicks) * 100).toFixed(1) + '%' : '—'}</td>
                  <td className="td">
                    <Toggle checked={l.enabled} onChange={() => toggleLink(l.id)} />
                  </td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toast('链接已复制')} className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink" title="复制">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => toast('二维码已下载')} className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-ink" title="二维码">
                        <QrCode size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone-400">最近创建：{links[0] && dateTime(links[0].createdAt)}</p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建分流链接"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              disabled={!form.name || !form.slug || form.accountIds.length === 0}
              onClick={() => {
                addLink({ ...form, enabled: true })
                setOpen(false)
                setForm({ name: '', slug: '', channel: 'whatsapp', accountIds: [], strategy: 'least_load' })
                toast('链接已创建')
              }}
            >
              创建
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="链接名称" hint="建议用广告投放计划命名，便于后面看来源报表">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="例如：FB 广告-智利批发" />
          </Field>
          <Field label="短链后缀">
            <div className="flex items-center rounded-lg border border-stone-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <span className="pl-3 font-mono text-sm text-stone-400">lnkp.to/</span>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/[^a-z0-9-]/gi, '') })} className="h-9 flex-1 rounded-r-lg bg-transparent pr-3 font-mono text-sm focus:outline-none" placeholder="cl-wholesale" />
            </div>
          </Field>
          <Field label="挂载账号">
            <div className="grid grid-cols-2 gap-2">
              {accounts
                .filter((a) => a.channel === form.channel)
                .map((a) => {
                  const on = form.accountIds.includes(a.id)
                  return (
                    <button
                      key={a.id}
                      disabled={a.status === 'banned'}
                      onClick={() => setForm({ ...form, accountIds: on ? form.accountIds.filter((x) => x !== a.id) : [...form.accountIds, a.id] })}
                      className={clsx('flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] disabled:opacity-40', on ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:bg-stone-50')}
                    >
                      <ChannelIcon channel={a.channel} />
                      <span className="flex-1 truncate">{a.name}</span>
                    </button>
                  )
                })}
            </div>
          </Field>
          <Field label="分配策略">
            <div className="space-y-1.5">
              {(Object.keys(STRATEGY) as TrafficLink['strategy'][]).map((k) => (
                <label key={k} className={clsx('flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2', form.strategy === k ? 'border-brand-500 bg-brand-50/50' : 'border-stone-200')}>
                  <input type="radio" checked={form.strategy === k} onChange={() => setForm({ ...form, strategy: k })} className="mt-1 accent-brand-600" />
                  <span>
                    <span className="block text-[13px] font-medium">{STRATEGY[k].label}</span>
                    <span className="block text-xs text-stone-500">{STRATEGY[k].desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </Field>
          {form.accountIds.length === 0 && (
            <p className="flex items-center gap-1 text-xs text-stone-400">
              <Link2 size={12} /> 至少选择一个账号
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
