import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Bot, Check, Headset, Plus } from 'lucide-react'
import { useStore } from '../../store'
import { CHANNELS } from '../../lib/meta'
import { agentSummary } from '../../lib/ai-customer'
import { Button, Modal } from '../ui'
import { CHANNEL_PLATFORM } from './meta'

export function AccountAiModal({ open, onClose, accountId }: { open: boolean; onClose: () => void; accountId: string }) {
  const account = useStore((s) => s.accounts.find((a) => a.id === accountId))
  const agents = useStore((s) => s.agents)
  const knowledge = useStore((s) => s.knowledge)
  const { updateAccount, toast } = useStore()
  const [pick, setPick] = useState<string | null>(account?.agentId ?? null)

  useEffect(() => {
    if (open) setPick(account?.agentId ?? null)
  }, [open, account?.agentId])

  const platform = account ? CHANNEL_PLATFORM[account.channel] : null
  const candidates = useMemo(() => agents.filter((g) => g.platform === platform), [agents, platform])
  if (!account) return null

  const save = () => {
    updateAccount(account.id, { agentId: pick })
    const ag = agents.find((g) => g.id === pick)
    toast(ag ? `${account.name} 已绑定 AI 客服 ${ag.name}，新进线客户将由 AI 托管` : `${account.name} 已解绑 AI，进线客户全部转人工`)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${account.name} · AI 托管设置`}
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={save}>
            保存
          </Button>
        </>
      }
    >
      <p className="mb-3 text-[13px] text-stone-500">
        为这个 {CHANNELS[account.channel].label} 账号选择接待客户的 AI 客服。AI 会按人设和知识库自动回复，并把识别到的信息写回客户档案；命中转人工规则时会提醒负责人。
      </p>
      <div className="space-y-2">
        {candidates.map((g) => {
          const docs = knowledge.filter((k) => k.assistantIds.includes(g.id)).length
          const on = pick === g.id
          return (
            <button
              key={g.id}
              onClick={() => setPick(g.id)}
              className={clsx('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors', on ? 'border-ai bg-ai-bg/50' : 'border-border hover:border-ai/40')}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: g.avatar }}>
                <Bot size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                  {g.name}
                  {g.status !== 'active' && <span className="pill-muted">已暂停</span>}
                </span>
                <span className="block truncate text-xs text-stone-500">
                  {agentSummary(g)} · 关联知识 {docs} 份
                </span>
              </span>
              {on && <Check size={16} className="text-ai" />}
            </button>
          )
        })}
        {candidates.length === 0 && <p className="rounded-xl bg-stone-50 px-3 py-4 text-center text-[13px] text-stone-500">还没有 {platform ?? CHANNELS[account.channel].label} 平台的 AI 客服</p>}
        <button
          onClick={() => setPick(null)}
          className={clsx('flex w-full items-center gap-3 rounded-xl border p-3 text-left', pick === null ? 'border-warn bg-warn-bg/50' : 'border-border hover:border-warn/40')}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn-bg text-warn">
            <Headset size={17} />
          </span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-semibold">不使用 AI</span>
            <span className="block text-xs text-stone-500">进线客户全部进入「待人工」队列，不消耗算力</span>
          </span>
          {pick === null && <Check size={16} className="text-warn" />}
        </button>
      </div>
      <Link to="/ai/agents" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ai-text no-underline hover:underline">
        <Plus size={12} /> 新建或调整 AI 客服人设
      </Link>
    </Modal>
  )
}
