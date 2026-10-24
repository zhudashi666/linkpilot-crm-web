import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Search, Download, Upload, Plus, Tag, UserCog, Send, MessageSquare, Users, Check, X } from 'lucide-react'
import { useStore, useMembers } from '../store'
import { CHANNELS, STAGES, TAG_POOL, relTime, money } from '../lib/meta'
import type { Channel, Stage } from '../types'
import { Avatar, Button, ChannelIcon, Drawer, Empty, Flag, PageHeader, StageBadge, Modal } from '../components/ui'
import { CustomerPanel } from '../components/CustomerPanel'

export default function Customers() {
  const contacts = useStore((s) => s.contacts)
  const conversations = useStore((s) => s.conversations)
  const { bulkTag, bulkAssign, toast } = useStore()
  const members = useMembers()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [stage, setStage] = useState<Stage | 'all'>('all')
  const [channel, setChannel] = useState<Channel | 'all'>('all')
  const [tag, setTag] = useState('all')
  const [owner, setOwner] = useState('all')
  const [sel, setSel] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [bulk, setBulk] = useState<'tag' | 'assign' | null>(null)
  const [bulkValue, setBulkValue] = useState('')

  const rows = useMemo(
    () =>
      contacts
        .filter((c) => {
          if (stage !== 'all' && c.stage !== stage) return false
          if (channel !== 'all' && c.channel !== channel) return false
          if (tag !== 'all' && !c.tags.includes(tag)) return false
          if (owner !== 'all' && c.ownerId !== owner) return false
          if (q) {
            const k = q.toLowerCase()
            if (![c.name, c.handle, c.fields.company ?? '', c.country].some((v) => v.toLowerCase().includes(k))) return false
          }
          return true
        })
        .sort((a, b) => b.lastActiveAt - a.lastActiveAt),
    [contacts, stage, channel, tag, owner, q],
  )

  const allSel = rows.length > 0 && rows.every((r) => sel.includes(r.id))
  const openContact = contacts.find((c) => c.id === open)
  const openConv = conversations.find((c) => c.contactId === open)
  const filtered = stage !== 'all' || channel !== 'all' || tag !== 'all' || owner !== 'all' || q

  return (
    <>
      <PageHeader
        title="客户管理"
        desc="所有渠道的客户统一建档。AI 接待时会自动补全资料、打标签、推进阶段。"
        actions={
          <>
            <Button icon={<Upload size={15} />} onClick={() => toast('导入功能：支持 Excel / CSV / 通讯录', 'info')}>
              导入
            </Button>
            <Button icon={<Download size={15} />} onClick={() => toast(`已导出 ${rows.length} 位客户`)}>
              导出
            </Button>
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => toast('新建客户表单（原型略）', 'info')}>
              新建客户
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button onClick={() => setStage('all')} className={clsx('rounded-lg px-3 py-1.5 text-[13px]', stage === 'all' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50')}>
          全部 <span className="tnum opacity-60">{contacts.length}</span>
        </button>
        {STAGES.map((s) => (
          <button key={s.key} onClick={() => setStage(s.key)} className={clsx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px]', stage === s.key ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50')}>
            <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
            {s.label} <span className="tnum opacity-60">{contacts.filter((c) => c.stage === s.key).length}</span>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3">
          <div className="relative w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input h-8 pl-8 text-[13px]" placeholder="姓名 / 号码 / 公司 / 国家" />
          </div>
          <select value={channel} onChange={(e) => setChannel(e.target.value as Channel | 'all')} className="input h-8 w-32 text-[13px]">
            <option value="all">全部渠道</option>
            {(Object.keys(CHANNELS) as Channel[]).map((c) => (
              <option key={c} value={c}>
                {CHANNELS[c].label}
              </option>
            ))}
          </select>
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="input h-8 w-32 text-[13px]">
            <option value="all">全部标签</option>
            {TAG_POOL.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className="input h-8 w-32 text-[13px]">
            <option value="all">全部负责人</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {filtered && (
            <button
              onClick={() => {
                setQ('')
                setStage('all')
                setChannel('all')
                setTag('all')
                setOwner('all')
              }}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-ink"
            >
              <X size={12} /> 清空筛选
            </button>
          )}
          <span className="tnum ml-auto text-xs text-stone-400">共 {rows.length} 位</span>
        </div>

        {sel.length > 0 && (
          <div className="flex animate-fade-in items-center gap-2 border-b border-brand-500/20 bg-brand-50 px-4 py-2 text-[13px]">
            <span className="tnum font-medium text-brand-800">已选 {sel.length} 位</span>
            <Button size="sm" icon={<Tag size={13} />} onClick={() => { setBulk('tag'); setBulkValue(TAG_POOL[0]) }}>打标签</Button>
            <Button size="sm" icon={<UserCog size={13} />} onClick={() => { setBulk('assign'); setBulkValue(members[0].id) }}>分配负责人</Button>
            <Button size="sm" icon={<Send size={13} />} onClick={() => nav('/campaigns?new=1')}>加入群发</Button>
            <button onClick={() => setSel([])} className="ml-auto text-xs text-stone-500 hover:text-ink">取消选择</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-[13px]">
            <thead className="bg-stone-50/80">
              <tr>
                <th className="th w-10">
                  <Check2 checked={allSel} onChange={() => setSel(allSel ? [] : rows.map((r) => r.id))} />
                </th>
                <th className="th">客户</th>
                <th className="th">渠道</th>
                <th className="th">阶段</th>
                <th className="th">标签</th>
                <th className="th">意向分</th>
                <th className="th text-right">预估金额</th>
                <th className="th">负责人</th>
                <th className="th">最近互动</th>
                <th className="th w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((c) => {
                const m = members.find((x) => x.id === c.ownerId)
                const conv = conversations.find((v) => v.contactId === c.id)
                return (
                  <tr key={c.id} onClick={() => setOpen(c.id)} className={clsx('cursor-pointer transition-colors duration-100 hover:bg-stone-50', sel.includes(c.id) && 'bg-brand-50/40')}>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <Check2 checked={sel.includes(c.id)} onChange={() => setSel((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))} />
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} color={c.color} size={30} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {c.name} <Flag flag={c.flag} />
                          </p>
                          <p className="truncate text-xs text-stone-400">{c.fields.company || c.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <ChannelIcon channel={c.channel} withLabel size={13} />
                    </td>
                    <td className="td">
                      <StageBadge stage={c.stage} />
                    </td>
                    <td className="td">
                      <div className="flex max-w-[200px] flex-wrap gap-1">
                        {c.tags.slice(0, 2).map((t) => (
                          <span key={t} className="rounded border border-stone-200 px-1.5 text-xs text-stone-600">
                            {t}
                          </span>
                        ))}
                        {c.tags.length > 2 && <span className="text-xs text-stone-400">+{c.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-stone-100">
                          <div className={clsx('h-full rounded-full', c.intent >= 70 ? 'bg-brand-500' : c.intent >= 45 ? 'bg-amber-500' : 'bg-stone-300')} style={{ width: `${c.intent}%` }} />
                        </div>
                        <span className="tnum text-xs text-stone-600">{c.intent}</span>
                      </div>
                    </td>
                    <td className="td tnum text-right">{c.dealValue ? money(c.dealValue) : <span className="text-stone-300">—</span>}</td>
                    <td className="td">
                      {m && (
                        <span className="flex items-center gap-1.5">
                          <Avatar name={m.name} color={m.color} size={20} />
                          {m.name}
                        </span>
                      )}
                    </td>
                    <td className="td text-stone-500">{relTime(c.lastActiveAt)}</td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      {conv && (
                        <button onClick={() => nav(`/inbox?c=${conv.id}`)} className="rounded-md p-1.5 text-stone-400 hover:bg-brand-50 hover:text-brand-700" title="去聊天">
                          <MessageSquare size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty icon={<Users size={20} />} title="没有找到客户" desc="调整筛选条件，或从 Excel 导入已有客户" />}
        </div>
      </div>

      <Drawer
        open={!!openContact}
        onClose={() => setOpen(null)}
        width={440}
        title={
          openContact && (
            <div className="flex items-center justify-between gap-2 pr-2">
              <span>客户详情</span>
              {openConv && (
                <Button size="sm" variant="soft" icon={<MessageSquare size={13} />} onClick={() => nav(`/inbox?c=${openConv.id}`)}>
                  去聊天
                </Button>
              )}
            </div>
          )
        }
      >
        {openContact && <CustomerPanel contactId={openContact.id} />}
      </Drawer>

      <Modal
        open={!!bulk}
        onClose={() => setBulk(null)}
        title={bulk === 'tag' ? `给 ${sel.length} 位客户打标签` : `给 ${sel.length} 位客户分配负责人`}
        width={420}
        footer={
          <>
            <Button onClick={() => setBulk(null)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (bulk === 'tag') bulkTag(sel, bulkValue)
                else bulkAssign(sel, bulkValue)
                toast(bulk === 'tag' ? `已为 ${sel.length} 位客户添加「${bulkValue}」` : `已分配给 ${members.find((m) => m.id === bulkValue)?.name}`)
                setBulk(null)
                setSel([])
              }}
            >
              确定
            </Button>
          </>
        }
      >
        {bulk === 'tag' ? (
          <div className="flex flex-wrap gap-1.5">
            {TAG_POOL.map((t) => (
              <button key={t} onClick={() => setBulkValue(t)} className={clsx('rounded-lg border px-2.5 py-1 text-[13px]', bulkValue === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-stone-200 hover:border-stone-300')}>
                {t}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {members.map((m) => (
              <button key={m.id} onClick={() => setBulkValue(m.id)} className={clsx('flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left', bulkValue === m.id ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:bg-stone-50')}>
                <Avatar name={m.name} color={m.color} size={26} />
                <span className="flex-1 text-[13px] font-medium">{m.name}</span>
                <span className="text-xs text-stone-400">{m.role}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}

function Check2({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="checkbox"
      aria-checked={checked}
      className={clsx('flex h-4 w-4 items-center justify-center rounded border transition-colors', checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 bg-white hover:border-brand-500')}
    >
      {checked && <Check size={11} strokeWidth={3} />}
    </button>
  )
}
