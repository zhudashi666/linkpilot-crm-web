import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Check, Clock, Trash2, MessageSquare, ListTodo, Plus } from 'lucide-react'
import { useStore, useMembers, currentUser } from '../store'
import { relTime, T } from '../lib/meta'
import type { Task } from '../types'
import { Avatar, Button, Empty, Field, Flag, Modal, PageHeader, Segmented } from '../components/ui'

type Src = 'all' | 'ai' | 'user' | 'sop'

export default function Tasks() {
  const tasks = useStore((s) => s.tasks)
  const contacts = useStore((s) => s.contacts)
  const conversations = useStore((s) => s.conversations)
  const { toggleTask, removeTask, addTask, toast } = useStore()
  const members = useMembers()
  const nav = useNavigate()
  const [src, setSrc] = useState<Src>('all')
  const [mine, setMine] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', contactId: contacts[0]?.id ?? '', days: 1, ownerId: currentUser.id })

  const now = Date.now()
  const endToday = new Date().setHours(23, 59, 59, 999)
  const list = tasks.filter((t) => (src === 'all' || t.createdBy === src) && (!mine || t.ownerId === currentUser.id))
  const groups: { key: string; title: string; tone: string; items: Task[] }[] = [
    { key: 'overdue', title: '已逾期', tone: 'text-red-600', items: list.filter((t) => !t.done && t.due < now) },
    { key: 'today', title: '今天', tone: 'text-ink', items: list.filter((t) => !t.done && t.due >= now && t.due <= endToday) },
    { key: 'later', title: '之后', tone: 'text-ink', items: list.filter((t) => !t.done && t.due > endToday) },
    { key: 'done', title: '已完成', tone: 'text-stone-400', items: list.filter((t) => t.done) },
  ]

  return (
    <>
      <PageHeader
        title="跟进任务"
        desc="AI 在对话中识别到需要跟进的事项会自动创建任务，SOP 流程也会生成人工跟进任务。"
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setOpen(true)}>
            新建任务
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<Src>
          value={src}
          onChange={setSrc}
          items={[
            { key: 'all', label: '全部来源' },
            { key: 'ai', label: 'AI 创建' },
            { key: 'sop', label: 'SOP 生成' },
            { key: 'user', label: '手动创建' },
          ]}
        />
        <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-stone-600">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="accent-brand-600" /> 只看我的
        </label>
      </div>

      <div className="space-y-5">
        {groups.map((g) =>
          g.items.length === 0 ? null : (
            <section key={g.key}>
              <h3 className={clsx('mb-2 text-[13px] font-semibold', g.tone)}>
                {g.title} <span className="tnum font-normal text-stone-400">{g.items.length}</span>
              </h3>
              <div className="card divide-y divide-stone-100">
                {g.items.sort((a, b) => a.due - b.due).map((t) => {
                  const c = contacts.find((x) => x.id === t.contactId)
                  const m = members.find((x) => x.id === t.ownerId)
                  const conv = conversations.find((v) => v.contactId === t.contactId)
                  return (
                    <div key={t.id} className="group flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => {
                          toggleTask(t.id)
                          if (!t.done) toast('任务已完成')
                        }}
                        className={clsx('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-colors', t.done ? 'border-brand-600 bg-brand-600 text-white' : 'border-stone-300 hover:border-brand-500')}
                        aria-label="完成"
                      >
                        {t.done && <Check size={12} strokeWidth={3} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={clsx('text-[13.5px]', t.done && 'text-stone-400 line-through')}>{t.title}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                          {c && (
                            <span>
                              {c.name} <Flag flag={c.flag} />
                              {c.fields.company && <span className="text-stone-400"> · {c.fields.company}</span>}
                            </span>
                          )}
                          {t.createdBy === 'ai' && <span className="pill-ai px-1.5 py-0 text-[11px]">AI 创建</span>}
                          {t.createdBy === 'sop' && <span className="pill bg-blue-50 px-1.5 py-0 text-[11px] text-blue-600 ring-blue-600/20">SOP</span>}
                        </p>
                      </div>
                      <span className={clsx('tnum flex shrink-0 items-center gap-1 text-xs', !t.done && t.due < now ? 'text-red-500' : 'text-stone-500')}>
                        <Clock size={12} /> {relTime(t.due)}
                      </span>
                      {m && <Avatar name={m.name} color={m.color} size={24} />}
                      <div className="flex w-16 justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {conv && (
                          <button onClick={() => nav(`/inbox?c=${conv.id}`)} className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-brand-700" title="去聊天">
                            <MessageSquare size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            removeTask(t.id)
                            toast('任务已删除', 'info')
                          }}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-500"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ),
        )}
        {list.length === 0 && (
          <div className="card">
            <Empty icon={<ListTodo size={20} />} title="没有任务" desc="AI 接待过程中发现需要跟进的事项时，会自动出现在这里" />
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建跟进任务"
        width={460}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              variant="primary"
              disabled={!form.title.trim()}
              onClick={() => {
                addTask({ title: form.title.trim(), contactId: form.contactId, due: Date.now() + form.days * T.DAY, ownerId: form.ownerId, createdBy: 'user' })
                setOpen(false)
                setForm((f) => ({ ...f, title: '' }))
                toast('任务已创建')
              }}
            >
              创建
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="任务内容">
            <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="例如：发送报价单 V2" />
          </Field>
          <Field label="关联客户">
            <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} className="input">
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}（{c.country}）{c.fields.company ? `· ${c.fields.company}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="截止">
              <select value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} className="input">
                <option value={0.1}>2 小时后</option>
                <option value={1}>明天</option>
                <option value={3}>3 天后</option>
                <option value={7}>1 周后</option>
              </select>
            </Field>
            <Field label="负责人">
              <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className="input">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Modal>
    </>
  )
}
