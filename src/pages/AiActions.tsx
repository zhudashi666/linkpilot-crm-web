import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Tag, TrendingUp, PenLine, ListPlus, UserRound, Undo2, Check, History, MessageSquare } from 'lucide-react'
import { useStore } from '../store'
import { dateTime } from '../lib/meta'
import type { AiAction, AiActionType } from '../types'
import { Badge, Button, Empty, Flag, PageHeader, Tabs } from '../components/ui'

const TYPE_ICON: Record<AiActionType, typeof Tag> = { add_tag: Tag, update_stage: TrendingUp, update_field: PenLine, create_task: ListPlus, handoff: UserRound }

type F = 'all' | 'pending_review' | 'applied' | 'reverted'

export default function AiActions() {
  const actions = useStore((s) => s.aiActions)
  const contacts = useStore((s) => s.contacts)
  const agents = useStore((s) => s.agents)
  const { revertAction, approveAction } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState<F>('all')
  const [type, setType] = useState<AiActionType | 'all'>('all')

  const list = actions.filter((a) => (f === 'all' || a.status === f) && (type === 'all' || a.type === type)).sort((a, b) => b.time - a.time)
  const pending = actions.filter((a) => a.status === 'pending_review')

  return (
    <>
      <PageHeader
        title="AI 动作日志"
        desc="AI 客服在 CRM 里做的每一次操作都会留痕，可以逐条撤销。开启了「先由人工确认」的 AI 客服，操作会先停在待确认。"
        actions={
          pending.length > 0 && (
            <Button variant="primary" icon={<Check size={14} />} onClick={() => pending.forEach((a) => approveAction(a.id))}>
              全部确认（{pending.length}）
            </Button>
          )
        }
      />
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 pr-4">
          <Tabs<F>
            className="flex-1 border-b-0 px-3"
            value={f}
            onChange={setF}
            items={[
              { key: 'all', label: '全部', count: actions.length },
              { key: 'pending_review', label: '待确认', count: pending.length },
              { key: 'applied', label: '已执行', count: actions.filter((a) => a.status === 'applied').length },
              { key: 'reverted', label: '已撤销', count: actions.filter((a) => a.status === 'reverted').length },
            ]}
          />
          <select value={type} onChange={(e) => setType(e.target.value as AiActionType | 'all')} className="input h-8 w-36 text-[13px]">
            <option value="all">全部类型</option>
            <option value="add_tag">添加标签</option>
            <option value="update_stage">推进阶段</option>
            <option value="update_field">填写字段</option>
            <option value="create_task">创建任务</option>
            <option value="handoff">转人工</option>
          </select>
        </div>
        <div className="divide-y divide-stone-100 border-t border-stone-200">
          {list.map((a) => (
            <Row
              key={a.id}
              a={a}
              contact={contacts.find((c) => c.id === a.contactId)}
              agentName={agents.find((g) => g.id === a.agentId)?.name}
              onRevert={() => revertAction(a.id)}
              onApprove={() => approveAction(a.id)}
              onChat={() => a.conversationId && nav(`/inbox?c=${a.conversationId}`)}
            />
          ))}
          {list.length === 0 && <Empty icon={<History size={20} />} title="没有记录" />}
        </div>
      </div>
    </>
  )
}

function Row({
  a,
  contact,
  agentName,
  onRevert,
  onApprove,
  onChat,
}: {
  a: AiAction
  contact?: { name: string; flag: string; fields: { company?: string } }
  agentName?: string
  onRevert: () => void
  onApprove: () => void
  onChat: () => void
}) {
  const Icon = TYPE_ICON[a.type]
  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3', a.status === 'pending_review' && 'bg-amber-50/40')}>
      <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', a.type === 'handoff' ? 'bg-amber-50 text-amber-600' : 'bg-ai-bg text-ai-text')}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={clsx('text-[13.5px]', a.status === 'reverted' && 'text-stone-400 line-through')}>
          <span className="font-medium">{a.label}</span>
          <span className="mx-1.5 text-stone-300">·</span>
          {a.detail}
        </p>
        <p className="mt-0.5 text-xs text-stone-500">
          {agentName} 对 {contact?.name} {contact && <Flag flag={contact.flag} />}
          {contact?.fields.company && <span className="text-stone-400">（{contact.fields.company}）</span>}
          <span className="tnum ml-2 text-stone-400">{dateTime(a.time)}</span>
        </p>
      </div>
      {a.status === 'applied' && <Badge className="bg-brand-50 text-brand-700">已执行</Badge>}
      {a.status === 'pending_review' && <Badge className="bg-amber-100 text-amber-700">待确认</Badge>}
      {a.status === 'reverted' && <Badge>已撤销</Badge>}
      <div className="flex w-[168px] justify-end gap-1">
        {a.conversationId && (
          <Button size="sm" variant="ghost" icon={<MessageSquare size={12} />} onClick={onChat}>
            对话
          </Button>
        )}
        {a.status === 'applied' && a.type !== 'handoff' && (
          <Button size="sm" icon={<Undo2 size={12} />} onClick={onRevert}>
            撤销
          </Button>
        )}
        {a.status === 'pending_review' && (
          <Button size="sm" variant="primary" icon={<Check size={12} />} onClick={onApprove}>
            确认
          </Button>
        )}
      </div>
    </div>
  )
}
