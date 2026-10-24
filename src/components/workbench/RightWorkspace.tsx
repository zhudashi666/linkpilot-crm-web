import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowDownToLine, Bot, BookOpen, Flag as FlagIcon, Megaphone, Sparkles, Trophy, UserRound, Wand2, Zap } from 'lucide-react'
import { useStore } from '../../store'
import { STAGES, relTime, stageMeta } from '../../lib/meta'
import { SUGGESTIONS, detectIntent } from '../../lib/ai-sim'
import { PRICING, fmtPoints } from '../../lib/billing'
import { CustomerPanel } from '../CustomerPanel'
import { Button } from '../ui'
import { INTENT_LABEL } from './meta'

type Tab = 'customer' | 'ai'

export function RightWorkspace({ convId, onInsert }: { convId: string; onInsert: (text: string) => void }) {
  const [tab, setTab] = useState<Tab>('customer')
  const conv = useStore((s) => s.conversations.find((c) => c.id === convId))!

  return (
    <aside className="hidden w-[320px] shrink-0 flex-col border-l border-border bg-card xl:flex">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-2">
        {(
          [
            ['customer', '客户档案', UserRound],
            ['ai', 'AI 助手', Sparkles],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={clsx('flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors', tab === k ? 'bg-line-dark text-line-text' : 'text-stone-500 hover:bg-stone-50')}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto">
        {tab === 'customer' ? (
          <>
            <JourneyCard convId={convId} />
            <CustomerPanel contactId={conv.contactId} />
          </>
        ) : (
          <AiAssistant convId={convId} onInsert={onInsert} />
        )}
      </div>
    </aside>
  )
}

/** 获客 → AI 接待 → 写回 CRM → 人工 → 成交 的进度，一眼看出这位客户卡在哪一步 */
function JourneyCard({ convId }: { convId: string }) {
  const conv = useStore((s) => s.conversations.find((c) => c.id === convId))!
  const contact = useStore((s) => s.contacts.find((c) => c.id === conv.contactId))!
  const allMessages = useStore((s) => s.messages)
  const allActions = useStore((s) => s.aiActions)
  const aiReplies = useMemo(() => allMessages.filter((m) => m.conversationId === convId && m.from === 'ai').length, [allMessages, convId])
  const humanReplies = useMemo(() => allMessages.filter((m) => m.conversationId === convId && m.from === 'agent').length, [allMessages, convId])
  const writebacks = useMemo(() => allActions.filter((a) => a.contactId === contact.id && a.status === 'applied').length, [allActions, contact.id])
  const stageIdx = STAGES.findIndex((s) => s.key === contact.stage)
  const won = contact.stage === 'won'
  const lost = contact.stage === 'lost'

  const steps = [
    { icon: Megaphone, label: '获客进线', value: contact.source, done: true },
    { icon: Bot, label: 'AI 接待', value: aiReplies ? `${aiReplies} 条回复 · ${fmtPoints(aiReplies * PRICING.replyPoints)} 点` : '未经过 AI', done: aiReplies > 0 },
    { icon: Zap, label: '写回 CRM', value: writebacks ? `${writebacks} 项资料已更新` : '暂无', done: writebacks > 0 },
    { icon: UserRound, label: '人工跟进', value: humanReplies ? `${humanReplies} 条人工回复` : conv.mode === 'pending' ? '等待接待' : '暂未介入', done: humanReplies > 0 },
    { icon: won ? Trophy : FlagIcon, label: '成交', value: won ? '已成交' : lost ? '已流失' : `当前：${stageMeta(contact.stage).label}`, done: won },
  ]

  return (
    <div className="border-b border-divider px-4 py-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-500">转化路径</p>
        <span className="text-[11px] text-stone-400">建档于 {relTime(contact.createdAt)}</span>
      </div>
      <ol className="mt-2.5 space-y-0">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-2.5 pb-2.5 last:pb-0">
            {i < steps.length - 1 && <span className={clsx('absolute left-[11px] top-6 h-[calc(100%-18px)] w-px', s.done ? 'bg-line/50' : 'bg-stone-200')} />}
            <span className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', s.done ? 'bg-line-dark text-line-text' : 'bg-stone-100 text-stone-400')}>
              <s.icon size={12} />
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span className="text-[12.5px] font-medium">{s.label}</span>
              <span className="ml-2 truncate text-[11.5px] text-stone-500">{s.value}</span>
            </span>
          </li>
        ))}
      </ol>
      {!won && !lost && stageIdx >= 0 && (
        <div className="mt-2.5 flex h-1.5 gap-0.5">
          {STAGES.filter((s) => s.key !== 'lost').map((s, i) => (
            <span key={s.key} className={clsx('flex-1 rounded-full', i <= stageIdx ? 'bg-line' : 'bg-stone-200')} />
          ))}
        </div>
      )}
    </div>
  )
}

function AiAssistant({ convId, onInsert }: { convId: string; onInsert: (text: string) => void }) {
  const conv = useStore((s) => s.conversations.find((c) => c.id === convId))!
  const contact = useStore((s) => s.contacts.find((c) => c.id === conv.contactId))!
  const account = useStore((s) => s.accounts.find((a) => a.id === conv.accountId))
  const agent = useStore((s) => s.agents.find((a) => a.id === account?.agentId))
  const knowledge = useStore((s) => s.knowledge)
  const allMessages = useStore((s) => s.messages)
  const lastIntent = useStore((s) => s.lastIntent[convId])
  const points = useStore((s) => s.billing.points)
  const { aiAssist, toast } = useStore()
  const [ask, setAsk] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const lastCustomer = useMemo(() => [...allMessages].reverse().find((m) => m.conversationId === convId && m.from === 'customer'), [allMessages, convId])
  const intent = lastIntent ?? detectIntent(lastCustomer?.text ?? '')
  const docs = useMemo(() => (agent ? knowledge.filter((k) => k.assistantIds.includes(agent.id)) : []), [knowledge, agent])

  const insert = (t: string) => {
    onInsert(t)
    toast(conv.mode === 'manual' ? '已插入输入框' : '已放入草稿，接管会话后即可发送', 'info')
  }

  const generate = () => {
    setLoading(true)
    setTimeout(() => {
      setResult(aiAssist(convId, ask))
      setLoading(false)
    }, 700)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-ai/20 bg-ai-bg/50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ai-text">
          <Sparkles size={13} /> 客户当前意图：{INTENT_LABEL[intent]}
        </p>
        {lastCustomer && <p className="mt-1.5 line-clamp-2 text-[12.5px] text-stone-600">“{lastCustomer.translated ?? lastCustomer.text}”</p>}
        <p className="mt-2 flex items-center gap-1 text-[11px] text-stone-500">
          <BookOpen size={11} /> 依据：{docs.length ? docs.slice(0, 2).map((d) => d.name).join('、') + (docs.length > 2 ? ` 等 ${docs.length} 份` : '') : '该账号 AI 客服未关联知识资料'}
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-stone-500">推荐回复 · 来自知识库话术</p>
        <div className="space-y-1.5">
          {SUGGESTIONS[intent].map((s) => (
            <div key={s} className="group flex items-start gap-2 rounded-lg border border-border px-2.5 py-2 text-[12.5px] hover:border-line/40">
              <span className="flex-1">{s}</span>
              <button onClick={() => insert(s)} className="shrink-0 rounded p-0.5 text-stone-400 hover:bg-line-dark hover:text-line-text" title="插入输入框">
                <ArrowDownToLine size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-stone-500">让 AI 帮你写</p>
        <textarea
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          rows={3}
          className="textarea text-[13px]"
          placeholder={`询问 AI，或告诉它应该如何回复…\n例如：语气热情一点 / 简短一点 / 更专业`}
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-stone-400">{fmtPoints(PRICING.replyPoints)} 算力点 / 次</span>
          <Button size="sm" variant="primary" className="ml-auto" icon={<Wand2 size={13} />} disabled={loading} onClick={generate}>
            {loading ? '生成中…' : '生成回复'}
          </Button>
        </div>
        {result && (
          <div className="mt-2.5 animate-fade-in rounded-xl border border-ai/25 bg-white p-3 shadow-card">
            <p className="text-[13px] leading-relaxed">{result}</p>
            <div className="mt-2 flex justify-end">
              <Button size="sm" variant="soft" icon={<ArrowDownToLine size={13} />} onClick={() => insert(result)}>
                插入输入框
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-card2 px-3 py-2.5 text-[11.5px] text-stone-500">
        客户使用 {contact.language}，你用中文回复即可，发送时自动翻译。AI 生成与翻译按算力计费，当前余额{' '}
        <b className={clsx('tnum', points < PRICING.lowBalancePoints ? 'text-danger' : 'text-ink')}>{fmtPoints(points)}</b> 点 ·{' '}
        <Link to="/billing" className="font-medium text-line-text no-underline hover:underline">
          订阅与用量
        </Link>
      </div>
    </div>
  )
}
