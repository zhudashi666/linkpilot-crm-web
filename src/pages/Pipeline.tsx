import { useState } from 'react'
import clsx from 'clsx'
import { Bot, Clock, GripVertical } from 'lucide-react'
import { useStore, useMembers } from '../store'
import { STAGES, money, relTime } from '../lib/meta'
import type { Stage } from '../types'
import { Avatar, ChannelIcon, Drawer, Flag, PageHeader } from '../components/ui'
import { CustomerPanel } from '../components/CustomerPanel'

export default function Pipeline() {
  const contacts = useStore((s) => s.contacts)
  const aiActions = useStore((s) => s.aiActions)
  const tasks = useStore((s) => s.tasks)
  const { setStage, toast } = useStore()
  const members = useMembers()
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [owner, setOwner] = useState('all')

  const list = contacts.filter((c) => owner === 'all' || c.ownerId === owner)
  const total = list.filter((c) => !['won', 'lost'].includes(c.stage)).reduce((a, c) => a + c.dealValue, 0)
  const won = list.filter((c) => c.stage === 'won').reduce((a, c) => a + c.dealValue, 0)

  return (
    <>
      <PageHeader
        title="销售管道"
        desc="拖动卡片即可推进阶段。带 AI 标记的卡片表示阶段是 AI 根据对话自动推进的。"
        actions={
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className="input h-9 w-36">
            <option value="all">全部负责人</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        }
      />
      <div className="mb-4 flex flex-wrap gap-6 text-[13px] text-stone-500">
        <span>
          进行中商机 <b className="tnum ml-1 text-base font-semibold text-ink">{money(total)}</b>
        </span>
        <span>
          已成交 <b className="tnum ml-1 text-base font-semibold text-brand-700">{money(won)}</b>
        </span>
        <span>
          赢单率 <b className="tnum ml-1 text-base font-semibold text-ink">{((list.filter((c) => c.stage === 'won').length / Math.max(1, list.filter((c) => ['won', 'lost'].includes(c.stage)).length)) * 100).toFixed(1)}%</b>
        </span>
      </div>

      <div className="scroll-thin -mx-6 flex gap-3 overflow-x-auto px-6 pb-4">
        {STAGES.map((s) => {
          const cards = list.filter((c) => c.stage === s.key).sort((a, b) => b.dealValue - a.dealValue)
          const sum = cards.reduce((a, c) => a + c.dealValue, 0)
          return (
            <div
              key={s.key}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(s.key)
              }}
              onDragLeave={() => setOver((o) => (o === s.key ? null : o))}
              onDrop={() => {
                if (drag) {
                  const c = contacts.find((x) => x.id === drag)
                  if (c && c.stage !== s.key) {
                    setStage(drag, s.key)
                    toast(`${c.name} → ${s.label}`)
                  }
                }
                setDrag(null)
                setOver(null)
              }}
              className={clsx('flex w-[248px] shrink-0 flex-col rounded-xl bg-stone-200/40 transition-colors duration-150', over === s.key && 'bg-brand-100/60 ring-2 ring-brand-300')}
            >
              <div className="flex items-center gap-2 px-3 pb-2 pt-3">
                <span className={clsx('h-2 w-2 rounded-full', s.dot)} />
                <span className="text-[13px] font-medium">{s.label}</span>
                <span className="tnum text-xs text-stone-400">{cards.length}</span>
                <span className="tnum ml-auto text-xs text-stone-500">{sum ? money(sum) : ''}</span>
              </div>
              <div className="flex min-h-[120px] flex-col gap-2 px-2 pb-2">
                {cards.map((c) => {
                  const m = members.find((x) => x.id === c.ownerId)
                  const aiMoved = aiActions.some((a) => a.contactId === c.id && a.type === 'update_stage' && a.status === 'applied' && a.payload.to === c.stage)
                  const next = tasks.filter((t) => t.contactId === c.id && !t.done).sort((a, b) => a.due - b.due)[0]
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDrag(c.id)}
                      onDragEnd={() => {
                        setDrag(null)
                        setOver(null)
                      }}
                      onClick={() => setOpen(c.id)}
                      className={clsx(
                        'group cursor-grab rounded-lg border border-stone-200/80 bg-white p-3 shadow-card transition-[box-shadow,opacity,transform] duration-150 hover:shadow-pop active:cursor-grabbing',
                        drag === c.id && 'rotate-1 opacity-50',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">
                            {c.fields.company || c.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone-500">
                            <ChannelIcon channel={c.channel} size={11} /> {c.name} <Flag flag={c.flag} />
                          </p>
                        </div>
                        <GripVertical size={14} className="shrink-0 text-stone-300 opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="tnum text-[13px] font-semibold">{c.dealValue ? money(c.dealValue) : '—'}</span>
                        {aiMoved && (
                          <span className="pill-ai px-1.5 py-0 text-[11px]">
                            <Bot size={10} /> AI 推进
                          </span>
                        )}
                        {m && <span className="ml-auto"><Avatar name={m.name} color={m.color} size={20} /></span>}
                      </div>
                      {next && (
                        <p className={clsx('mt-2 flex items-center gap-1 truncate border-t border-stone-100 pt-2 text-[11px]', next.due < Date.now() ? 'text-red-500' : 'text-stone-500')}>
                          <Clock size={10} className="shrink-0" /> {relTime(next.due)} · {next.title}
                        </p>
                      )}
                    </div>
                  )
                })}
                {cards.length === 0 && <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-stone-300 py-6 text-xs text-stone-400">拖到这里</div>}
              </div>
            </div>
          )
        })}
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title="客户详情" width={440}>
        {open && <CustomerPanel contactId={open} />}
      </Drawer>
    </>
  )
}
