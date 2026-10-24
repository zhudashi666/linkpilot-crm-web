import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Sparkles, Plus, X, Check, Undo2, Clock, Building2, Package, Wallet, Mail, RefreshCw, Bot } from 'lucide-react'
import { useStore, useMembers } from '../store'
import { STAGES, TAG_POOL, relTime, money, T } from '../lib/meta'
import type { Contact } from '../types'
import { Avatar, ChannelIcon, Flag, StageBadge } from './ui'

const FIELD_META: { key: keyof Contact['fields']; label: string; icon: typeof Building2 }[] = [
  { key: 'company', label: '公司', icon: Building2 },
  { key: 'product', label: '意向产品', icon: Package },
  { key: 'budget', label: '预算', icon: Wallet },
  { key: 'email', label: '邮箱', icon: Mail },
]

export function CustomerPanel({ contactId, compact }: { contactId: string; compact?: boolean }) {
  const contact = useStore((s) => s.contacts.find((c) => c.id === contactId))
  const accounts = useStore((s) => s.accounts)
  const allTasks = useStore((s) => s.tasks)
  const allActions = useStore((s) => s.aiActions)
  const tasks = useMemo(() => allTasks.filter((t) => t.contactId === contactId), [allTasks, contactId])
  const actions = useMemo(() => allActions.filter((a) => a.contactId === contactId), [allActions, contactId])
  const agents = useStore((s) => s.agents)
  const flash = useStore((s) => s.flash[contactId])
  const { setStage, addTag, removeTag, updateContactField, updateContact, addTask, toggleTask, revertAction, approveAction, toast } = useStore()
  const members = useMembers()
  const [tagOpen, setTagOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [newTask, setNewTask] = useState('')
  const [regen, setRegen] = useState(false)

  if (!contact) return null
  const account = accounts.find((a) => a.id === contact.accountId)
  const stageIdx = STAGES.findIndex((s) => s.key === contact.stage)
  const flashing = flash && Date.now() - flash < 2000
  const openTasks = tasks.filter((t) => !t.done)

  return (
    <div className="divide-y divide-stone-100">
      {!compact && (
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <Avatar name={contact.name} color={contact.color} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{contact.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                <Flag flag={contact.flag} />
                {contact.country} · {contact.language}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                <ChannelIcon channel={contact.channel} size={12} />
                <span className="tnum truncate">{contact.handle}</span>
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-stone-50 py-1.5">
              <p className="text-[11px] text-stone-400">意向分</p>
              <p className={clsx('tnum text-sm font-semibold', contact.intent >= 70 ? 'text-brand-700' : contact.intent >= 45 ? 'text-amber-600' : 'text-stone-500')}>{contact.intent}</p>
            </div>
            <div className="rounded-lg bg-stone-50 py-1.5">
              <p className="text-[11px] text-stone-400">预估金额</p>
              <p className="tnum text-sm font-semibold">{contact.dealValue ? money(contact.dealValue) : '—'}</p>
            </div>
            <div className="rounded-lg bg-stone-50 py-1.5">
              <p className="text-[11px] text-stone-400">负责人</p>
              <select
                value={contact.ownerId}
                onChange={(e) => {
                  updateContact(contact.id, { ownerId: e.target.value })
                  toast('已更换负责人')
                }}
                className="w-full cursor-pointer bg-transparent text-center text-sm font-semibold focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-stone-400">
            来源 {contact.source} · 账号 {account?.name ?? '—'} · 创建于 {relTime(contact.createdAt)}
          </p>
        </div>
      )}

      <section className={clsx('px-4 py-3.5', flashing && 'animate-flash')}>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-medium text-stone-500">销售阶段</h4>
          <StageBadge stage={contact.stage} />
        </div>
        <div className="flex gap-1">
          {STAGES.filter((s) => s.key !== 'lost').map((s, i) => (
            <button
              key={s.key}
              title={s.label}
              onClick={() => {
                setStage(contact.id, s.key)
                toast(`阶段已更新为「${s.label}」`)
              }}
              className={clsx(
                'h-1.5 flex-1 rounded-full transition-colors duration-150',
                contact.stage !== 'lost' && i <= stageIdx ? 'bg-brand-500' : 'bg-stone-200 hover:bg-stone-300',
              )}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setStage(contact.id, s.key)
                toast(`阶段已更新为「${s.label}」`)
              }}
              className={clsx(
                'rounded-md px-1.5 py-0.5 text-[11px] transition-colors duration-150',
                contact.stage === s.key ? s.color + ' font-medium' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="flex items-center gap-1 text-xs font-medium text-stone-500">
            <Sparkles size={12} className="text-ai" /> AI 客户摘要
          </h4>
          <button
            onClick={() => {
              setRegen(true)
              setTimeout(() => {
                setRegen(false)
                toast('摘要已根据最新对话更新')
              }, 900)
            }}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-brand-700"
          >
            <RefreshCw size={11} className={regen ? 'animate-spin' : ''} /> 重新生成
          </button>
        </div>
        <p className={clsx('ai-surface rounded-[10px] px-3 py-2 text-[13px] leading-relaxed text-stone-700', regen && 'opacity-40')}>{contact.summary}</p>
      </section>

      <section className={clsx('px-4 py-3.5', flashing && 'animate-flash')}>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-medium text-stone-500">标签</h4>
          <button onClick={() => setTagOpen((v) => !v)} className="flex items-center gap-0.5 text-[11px] text-stone-400 hover:text-brand-700">
            <Plus size={12} /> 添加
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {contact.tags.length === 0 && <span className="text-xs text-stone-400">暂无标签</span>}
          {contact.tags.map((t) => (
            <span key={t} className="group inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-xs text-stone-700">
              {t}
              <button onClick={() => removeTag(contact.id, t)} className="text-stone-300 hover:text-red-500" aria-label={`移除 ${t}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        {tagOpen && (
          <div className="mt-2 flex animate-fade-in flex-wrap gap-1 rounded-lg border border-dashed border-stone-200 p-2">
            {TAG_POOL.filter((t) => !contact.tags.includes(t)).map((t) => (
              <button key={t} onClick={() => addTag(contact.id, t)} className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600 hover:bg-brand-50 hover:text-brand-700">
                + {t}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={clsx('px-4 py-3.5', flashing && 'animate-flash')}>
        <h4 className="mb-2 text-xs font-medium text-stone-500">客户资料</h4>
        <div className="space-y-1">
          {FIELD_META.map((f) => (
            <div key={f.key} className="group flex min-h-[30px] items-center gap-2 text-[13px]">
              <f.icon size={13} className="shrink-0 text-stone-400" />
              <span className="w-14 shrink-0 text-stone-500">{f.label}</span>
              {editing === f.key ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    updateContactField(contact.id, f.key, draft)
                    setEditing(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  className="input h-7 flex-1 px-2 text-[13px]"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditing(f.key)
                    setDraft(contact.fields[f.key] ?? '')
                  }}
                  className="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left hover:bg-stone-100"
                >
                  {contact.fields[f.key] || <span className="text-stone-300">点击填写</span>}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-medium text-stone-500">跟进任务 {openTasks.length > 0 && <span className="tnum text-stone-400">· {openTasks.length}</span>}</h4>
        </div>
        <div className="space-y-1">
          {tasks.length === 0 && <p className="text-xs text-stone-400">暂无任务</p>}
          {tasks.map((t) => {
            const overdue = !t.done && t.due < Date.now()
            return (
              <div key={t.id} className="flex items-start gap-2 rounded-lg px-1 py-1 hover:bg-stone-50">
                <button
                  onClick={() => toggleTask(t.id)}
                  className={clsx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors', t.done ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 hover:border-brand-500')}
                  aria-label="完成任务"
                >
                  {t.done && <Check size={11} strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={clsx('text-[13px] leading-snug', t.done && 'text-stone-400 line-through')}>{t.title}</p>
                  <p className={clsx('mt-0.5 flex items-center gap-1 text-[11px]', overdue ? 'text-red-500' : 'text-stone-400')}>
                    <Clock size={10} /> {overdue ? '已逾期 · ' : ''}
                    {relTime(t.due)}
                    {t.createdBy === 'ai' && <span className="pill-ai ml-1 px-1.5 py-0 text-[11px]">AI 创建</span>}
                    {t.createdBy === 'sop' && <span className="pill ml-1 bg-blue-50 px-1.5 py-0 text-[11px] text-blue-600 ring-blue-600/20">SOP</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newTask.trim()) return
            addTask({ contactId: contact.id, title: newTask.trim(), due: Date.now() + T.DAY, ownerId: contact.ownerId, createdBy: 'user' })
            setNewTask('')
            toast('已添加跟进任务（默认明天到期）')
          }}
        >
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)} className="input h-8 text-[13px]" placeholder="添加任务，回车保存" />
        </form>
      </section>

      <section className="px-4 py-3.5">
        <h4 className="mb-2 flex items-center gap-1 text-xs font-medium text-stone-500">
          <Bot size={12} className="text-ai" /> AI 对该客户的操作
        </h4>
        {actions.length === 0 && <p className="text-xs text-stone-400">AI 还没有对这个客户做过操作</p>}
        <ol className="relative space-y-2.5 border-l border-stone-200 pl-3.5">
          {actions.slice(0, 8).map((a) => {
            const agent = agents.find((g) => g.id === a.agentId)
            return (
              <li key={a.id} className="relative">
                <span
                  className={clsx(
                    'absolute -left-[18.5px] top-1.5 h-2 w-2 rounded-full ring-2 ring-white',
                    a.status === 'applied' ? 'bg-brand-500' : a.status === 'pending_review' ? 'bg-amber-500' : 'bg-stone-300',
                  )}
                />
                <p className={clsx('text-[13px]', a.status === 'reverted' && 'text-stone-400 line-through')}>
                  <span className="font-medium">{a.label}</span> <span className="text-stone-600">{a.detail}</span>
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-400">
                  <span>
                    {agent?.name} · {relTime(a.time)}
                  </span>
                  {a.status === 'applied' && (
                    <button onClick={() => revertAction(a.id)} className="flex items-center gap-0.5 hover:text-red-500">
                      <Undo2 size={10} /> 撤销
                    </button>
                  )}
                  {a.status === 'pending_review' && (
                    <>
                      <span className="text-amber-600">待确认</span>
                      <button onClick={() => approveAction(a.id)} className="font-medium text-brand-700 hover:underline">
                        确认执行
                      </button>
                    </>
                  )}
                  {a.status === 'reverted' && <span>已撤销</span>}
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
