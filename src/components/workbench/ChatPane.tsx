import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { AlertTriangle, Bot, CircleSlash, FlaskConical, Hand, Languages, PanelRight, Paperclip, RotateCcw, Send, Smile, Sparkles, Star, Undo2, Zap } from 'lucide-react'
import { useStore } from '../../store'
import { CHANNELS, clock } from '../../lib/meta'
import { CUSTOMER_PRESETS } from '../../lib/ai-sim'
import { PRICING, fmtPoints } from '../../lib/billing'
import { Avatar, Button, Flag, Toggle } from '../ui'
import { RECEPTION } from './meta'
import type { AiAction, Message } from '../../types'

const QUICK_REPLIES = ['您好，我是 SolarVolt 的销售顾问，很高兴为您服务。', '这是我们最新的产品目录，请查收。', '报价单已发送到您的邮箱，请注意查收。', '请问您方便留一个邮箱吗？']

export function ChatPane({
  convId,
  draft,
  setDraft,
  rightOpen,
  onToggleRight,
}: {
  convId: string
  draft: string
  setDraft: (v: string) => void
  rightOpen: boolean
  onToggleRight: () => void
}) {
  const conv = useStore((s) => s.conversations.find((c) => c.id === convId))!
  const contact = useStore((s) => s.contacts.find((c) => c.id === conv.contactId))!
  const account = useStore((s) => s.accounts.find((a) => a.id === conv.accountId))
  const agent = useStore((s) => s.agents.find((a) => a.id === account?.agentId))
  const allMessages = useStore((s) => s.messages)
  const aiActions = useStore((s) => s.aiActions)
  const typing = useStore((s) => s.typing[convId])
  const { setMode, markRead, sendAgentMessage, customerSays, toggleStar, revertAction, toast } = useStore()
  const msgs = useMemo(() => allMessages.filter((m) => m.conversationId === convId), [allMessages, convId])
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [translateOnSend, setTranslateOnSend] = useState(true)
  const [quickOpen, setQuickOpen] = useState(false)
  const [demoText, setDemoText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    markRead(convId)
  }, [convId, msgs.length, markRead])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [msgs.length, typing])

  const aiReady = !!agent && agent.status === 'active'
  const manual = conv.mode === 'manual'
  const rc = RECEPTION[conv.mode]
  const offline = account?.status !== 'online'

  const takeover = (on: boolean) => {
    if (on) {
      setMode(convId, 'manual')
      return
    }
    if (!aiReady) {
      toast(agent ? `AI 客服 ${agent.name} 已暂停，请先在 AI 客服中启用` : '该账号未绑定 AI 客服，无法交还 AI 托管', 'warn')
      return
    }
    setMode(convId, 'ai')
  }

  const send = () => {
    if (!draft.trim() || !manual) return
    sendAgentMessage(convId, draft.trim())
    setDraft('')
  }

  return (
    <section className="chat-canvas flex min-w-0 flex-1 flex-col">
      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2">
        <Avatar name={contact.name} color={contact.color} size={36} />
        <div className="min-w-[160px] flex-1">
          <div className="flex items-center gap-1.5">
            <span className="min-w-0 truncate text-[14.5px] font-semibold">{contact.name}</span>
            <Flag flag={contact.flag} />
            {agent ? (
              <span className={clsx('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-px text-[11px] font-medium', aiReady ? 'bg-ai-bg text-ai-text' : 'bg-stone-100 text-stone-500')}>
                <Bot size={11} /> {agent.name}
                {!aiReady && ' · 已暂停'}
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warn-bg px-2 py-px text-[11px] font-medium text-warn">
                <Bot size={11} /> 未绑定 AI
              </span>
            )}
            <button onClick={() => toggleStar(convId)} className="rounded p-0.5 text-stone-300 hover:text-amber-400" aria-label="星标">
              <Star size={14} className={conv.starred ? 'fill-amber-400 text-amber-400' : ''} />
            </button>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-stone-500">
            <span className="font-mono font-semibold tracking-wide text-stone-600">{CHANNELS[contact.channel].label.toUpperCase()}</span>
            <span className="text-stone-300">·</span>
            <span className="min-w-0 truncate">{account?.name}</span>
            {offline ? <span className="shrink-0 rounded bg-warn-bg px-1.5 font-semibold text-warn">账号离线</span> : <span className={clsx('shrink-0 rounded px-1.5 font-semibold', rc.cls)}>{conv.mode === 'ai' ? 'AI 托管中' : conv.mode === 'manual' ? '人工接待中' : rc.label}</span>}
          </p>
        </div>

        <div className="flex h-8 shrink-0 items-center overflow-hidden rounded-lg border border-border text-xs">
          <button
            onClick={() => setAutoTranslate((v) => !v)}
            className={clsx('flex h-full items-center gap-1 whitespace-nowrap px-2.5 font-medium transition-colors', autoTranslate ? 'bg-line-dark/60 text-line-text' : 'text-stone-500 hover:bg-stone-50')}
          >
            <Languages size={13} /> 自动翻译
          </button>
          <span className="hidden h-full items-center whitespace-nowrap border-l border-border px-2.5 text-stone-500 min-[1800px]:flex">
            {contact.language} → 中文
          </span>
        </div>
        {conv.mode !== 'closed' ? (
          <button onClick={() => setMode(convId, 'closed')} title="结束会话" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100">
            <CircleSlash size={15} />
          </button>
        ) : (
          <Button size="sm" variant="ghost" icon={<RotateCcw size={13} />} onClick={() => setMode(convId, aiReady ? 'ai' : 'manual')}>
            重新打开
          </Button>
        )}
        <button
          onClick={onToggleRight}
          className={clsx('flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors', rightOpen ? 'border-line/30 bg-[#F4FBF6] text-line-text' : 'border-border text-stone-600 hover:bg-stone-50')}
          title="客户档案与 AI 助手"
        >
          <PanelRight size={14} /> <Sparkles size={12} /> AI
        </button>
      </header>

      {conv.mode === 'pending' && (
        <div className="flex items-center gap-2 border-b border-warn/30 bg-warn-bg px-4 py-2 text-[13px] text-warn">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="flex-1">
            AI 已暂停，等待人工接待：<b className="font-semibold">{conv.handoffReason}</b>
          </span>
          {conv.handoffReason?.includes('算力') && (
            <Link to="/billing" className="font-semibold text-warn underline-offset-2 hover:underline">
              去充值
            </Link>
          )}
          <button onClick={() => setMode(convId, 'manual')} className="font-semibold underline-offset-2 hover:underline">
            立即接管
          </button>
        </div>
      )}

      <div className="scroll-thin flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-[760px] space-y-3">
          {msgs.map((m) => (
            <Bubble key={m.id} m={m} contactName={contact.name} translate={autoTranslate} actions={aiActions.filter((a) => m.actionIds?.includes(a.id))} onRevert={revertAction} />
          ))}
          {typing && (
            <div className="flex justify-end">
              <div className="flex items-center gap-2 rounded-xl rounded-br-[4px] border border-ai/20 bg-ai-bg px-3.5 py-2.5 text-xs text-ai-text">
                <Bot size={13} /> {agent?.name} 正在查询知识库并回复
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1 w-1 animate-typing rounded-full bg-ai" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-dashed border-stone-300 bg-stone-50 px-4 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
            <FlaskConical size={12} /> 演示：模拟客户发消息
          </span>
          {CUSTOMER_PRESETS.map((p) => (
            <button key={p.label} onClick={() => customerSays(convId, p.text, p.zh)} className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11.5px] text-stone-600 hover:border-line/50 hover:text-line-text">
              {p.label}
            </button>
          ))}
          <form
            className="ml-auto flex"
            onSubmit={(e) => {
              e.preventDefault()
              if (!demoText.trim()) return
              customerSays(convId, demoText.trim(), demoText.trim())
              setDemoText('')
            }}
          >
            <input value={demoText} onChange={(e) => setDemoText(e.target.value)} placeholder="或输入客户的话…" className="h-6 w-40 rounded-full border border-stone-200 bg-white px-2.5 text-[11.5px] focus:border-line focus:outline-none" />
          </form>
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 pb-3 pt-2">
        <div className="mb-2 flex items-center gap-2 text-xs">
          {conv.mode === 'ai' && (
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-ai-text">
              <Bot size={13} className="shrink-0" />
              <span className="truncate">AI 托管中 · {agent?.name} 自动回复并写回客户档案，每条消耗 {fmtPoints(PRICING.replyPoints)} 算力点</span>
            </span>
          )}
          {conv.mode === 'pending' && (
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-warn">
              <AlertTriangle size={13} className="shrink-0" />
              <span className="truncate">客户正在等待人工回复，打开右侧开关接管</span>
            </span>
          )}
          {manual && (
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-line-text">
              <Hand size={13} className="shrink-0" />
              <span className="truncate">你已接管，AI 暂停自动回复，可在右侧 AI 助手生成回复</span>
            </span>
          )}
          {conv.mode === 'closed' && (
            <span className="flex flex-1 items-center gap-1.5 text-stone-500">
              <CircleSlash size={13} /> 会话已结束，客户再次发消息时会自动重新打开
            </span>
          )}
          {conv.mode !== 'closed' && (
            <label className="flex shrink-0 items-center gap-2 font-medium text-stone-600">
              人工接管
              <Toggle checked={manual} onChange={takeover} />
            </label>
          )}
        </div>

        {manual ? (
          <div className="rounded-xl border border-border transition-[border-color,box-shadow] focus-within:border-line focus-within:ring-2 focus-within:ring-line/15">
            {draft.trim() && translateOnSend && (
              <div className="flex items-start gap-2 rounded-t-xl border-b border-divider bg-[#F4FBF6] px-3 py-1.5 text-xs text-line-text">
                <Languages size={13} className="mt-0.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  发送时译为 <b>{contact.language}</b> 送达客户，消耗 {PRICING.translatePoints} 算力点
                </span>
              </div>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={2}
              className="block w-full resize-none rounded-t-xl bg-transparent px-3 py-2 text-sm focus:outline-none"
              placeholder={`用中文输入${translateOnSend ? `，发送时自动翻译为${contact.language}` : ''}。Enter 发送，Shift+Enter 换行`}
            />
            <div className="relative flex items-center gap-1 px-2 pb-2">
              <button className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100" aria-label="表情">
                <Smile size={16} />
              </button>
              <button className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100" aria-label="附件">
                <Paperclip size={16} />
              </button>
              <button onClick={() => setQuickOpen((v) => !v)} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-stone-500 hover:bg-stone-100">
                <Zap size={14} /> 快捷话术
              </button>
              {quickOpen && (
                <div className="absolute bottom-10 left-2 z-10 w-80 animate-pop-in rounded-xl border border-border bg-white p-1.5 shadow-pop">
                  {QUICK_REPLIES.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setDraft(r)
                        setQuickOpen(false)
                      }}
                      className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-stone-50"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
              <label className="ml-auto flex items-center gap-1.5 text-[11px] text-stone-500">
                <Languages size={12} /> 发送翻译
                <Toggle checked={translateOnSend} onChange={setTranslateOnSend} />
              </label>
              <Button size="sm" variant="primary" icon={<Send size={13} />} disabled={!draft.trim()} onClick={send}>
                发送
              </Button>
            </div>
          </div>
        ) : (
          conv.mode !== 'closed' && (
            <button onClick={() => takeover(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card2 py-3 text-[13px] text-stone-500 hover:border-line/50 hover:text-line-text">
              <Hand size={15} /> 接管后即可亲自回复{draft ? '（已为你保留 AI 助手插入的草稿）' : ''}
            </button>
          )
        )}
      </div>
    </section>
  )
}

function Bubble({ m, contactName, translate, actions, onRevert }: { m: Message; contactName: string; translate: boolean; actions: AiAction[]; onRevert: (id: string) => void }) {
  if (m.from === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="max-w-[80%] rounded-full bg-stone-200/60 px-3 py-1 text-center text-[11.5px] text-stone-500">
          {m.text} · {clock(m.time)}
        </span>
      </div>
    )
  }
  const mine = m.from !== 'customer'
  const isAi = m.from === 'ai'
  const secondary = translate ? m.translated : undefined

  return (
    <div className={clsx('flex animate-fade-in', mine ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-[78%]', mine && 'flex flex-col items-end')}>
        <p className="msg-meta mb-1 flex items-center gap-1.5 px-1">
          {m.from === 'customer' && contactName}
          {isAi && (
            <span className="pill-ai px-1.5 py-0 text-[11px]">
              <Bot size={10} /> AI · {m.agentName}
            </span>
          )}
          {m.from === 'agent' && <span className="pill-on px-1.5 py-0 text-[11px]">人工 · {m.agentName}</span>}
          <span className="tnum">{clock(m.time)}</span>
        </p>
        <div className={clsx('msg-bubble', m.from === 'customer' ? 'msg-bubble--customer' : 'msg-bubble--agent')}>
          <p>{m.text}</p>
          {secondary && <p className="mt-1.5 border-t border-black/[0.06] pt-1.5 text-[12.5px] text-stone-500">{secondary}</p>}
        </div>
        {actions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap justify-end gap-1">
            {actions.map((a) => (
              <span
                key={a.id}
                className={clsx(
                  'group inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]',
                  a.status === 'applied' && 'border-ai/20 bg-ai-bg text-ai-text',
                  a.status === 'pending_review' && 'border-warn/30 bg-warn-bg text-warn',
                  a.status === 'reverted' && 'border-stone-200 bg-white text-stone-400 line-through',
                )}
              >
                <Zap size={10} />
                写回 CRM · {a.label}：{a.detail}
                {a.status === 'pending_review' && (
                  <Link to="/ai/actions" className="ml-0.5 no-underline">
                    待确认
                  </Link>
                )}
                {a.status === 'applied' && a.type !== 'handoff' && (
                  <button onClick={() => onRevert(a.id)} className="ml-0.5 hidden text-stone-400 hover:text-red-500 group-hover:inline" aria-label="撤销">
                    <Undo2 size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
