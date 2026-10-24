import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { Bot, ChevronRight, Headset, Layers, MessagesSquare, Plus, Search, Sparkles, Star, UserPlus } from 'lucide-react'
import { useStore } from '../store'
import { CHANNELS, relTime, stageMeta } from '../lib/meta'
import { Avatar, Button, ChannelIcon, Empty, Flag, PageHeader } from '../components/ui'
import { ChatPane } from '../components/workbench/ChatPane'
import { RightWorkspace } from '../components/workbench/RightWorkspace'
import { AccountAiModal } from '../components/workbench/AccountAiModal'
import { ACCOUNT_STATUS, RECEPTION } from '../components/workbench/meta'
import type { Channel } from '../types'

type Filter = 'all' | 'pending' | 'ai' | 'manual'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待人工' },
  { key: 'ai', label: 'AI托管' },
  { key: 'manual', label: '人工' },
]

export default function Inbox() {
  const [params, setParams] = useSearchParams()
  const conversations = useStore((s) => s.conversations)
  const contacts = useStore((s) => s.contacts)
  const accounts = useStore((s) => s.accounts)
  const agents = useStore((s) => s.agents)
  const messages = useStore((s) => s.messages)
  const { bulkSetMode, simulateInbound, toast } = useStore()

  const [platform, setPlatform] = useState<Channel | 'all'>('all')
  const [accountId, setAccountId] = useState<string>('all')
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [aiModal, setAiModal] = useState(false)
  const [rightOpen, setRightOpen] = useState(true)
  const [draft, setDraft] = useState('')

  const platformAccounts = useMemo(() => accounts.filter((a) => platform === 'all' || a.channel === platform), [accounts, platform])
  const account = accounts.find((a) => a.id === accountId)
  const accountAgent = agents.find((g) => g.id === account?.agentId)

  const scoped = useMemo(
    () =>
      conversations.filter((c) => {
        const acc = accounts.find((a) => a.id === c.accountId)
        if (!acc) return false
        if (accountId !== 'all') return c.accountId === accountId
        return platform === 'all' || acc.channel === platform
      }),
    [conversations, accounts, accountId, platform],
  )

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return scoped
      .map((c) => ({ conv: c, contact: contacts.find((x) => x.id === c.contactId)!, last: [...messages].reverse().find((m) => m.conversationId === c.id && m.from !== 'system') }))
      .filter(({ conv, contact }) => {
        if (!contact) return false
        if (filter !== 'all' && conv.mode !== filter) return false
        if (kw && !(contact.name.toLowerCase().includes(kw) || contact.handle.includes(kw) || conv.id.includes(kw))) return false
        return true
      })
      .sort((a, b) => Number(b.conv.mode === 'pending') - Number(a.conv.mode === 'pending') || b.conv.lastMessageAt - a.conv.lastMessageAt)
  }, [scoped, contacts, messages, filter, q])

  const count = (f: Filter) => (f === 'all' ? scoped.length : scoped.filter((c) => c.mode === f).length)

  const selectedId = params.get('c') ?? rows[0]?.conv.id
  const selected = conversations.find((c) => c.id === selectedId)

  useEffect(() => {
    setDraft('')
  }, [selectedId])

  const pendingByAccount = (id: string) => conversations.filter((c) => c.accountId === id && c.mode === 'pending').length

  const toManual = scoped.filter((c) => c.mode === 'ai').map((c) => c.id)
  const toAiCandidates = scoped.filter((c) => c.mode === 'manual' || c.mode === 'pending')
  const toAi = toAiCandidates
    .filter((c) => {
      const acc = accounts.find((a) => a.id === c.accountId)
      return agents.some((g) => g.id === acc?.agentId && g.status === 'active')
    })
    .map((c) => c.id)

  const batch = (mode: 'ai' | 'manual') => {
    const ids = mode === 'ai' ? toAi : toManual
    const n = bulkSetMode(ids, mode)
    const skipped = mode === 'ai' ? toAiCandidates.length - toAi.length : 0
    toast(
      mode === 'ai'
        ? `已将 ${n} 个会话交还 AI 托管${skipped ? `，${skipped} 个会话所在账号未绑定运行中的 AI 客服，已跳过` : ''}`
        : `已接管 ${n} 个会话，AI 暂停自动回复`,
      skipped ? 'warn' : 'success',
    )
  }

  const inbound = () => {
    const id = simulateInbound(accountId !== 'all' ? accountId : undefined)
    if (!id) {
      toast('当前账号不可接待新客户（离线或已封禁）', 'warn')
      return
    }
    setFilter('all')
    setParams({ c: id })
    toast('新客户已进线：自动建档并分配负责人，AI 客服开始接待')
  }

  return (
    <>
      <PageHeader
        title="客服工作台"
        desc="AI 托管与人工接管的统一会话台"
        actions={
          <Button size="sm" icon={<UserPlus size={14} />} onClick={inbound}>
            演示：新客户进线
          </Button>
        }
      />
      <div className="flex h-full min-h-0">
        <aside className="flex w-[184px] shrink-0 flex-col border-r border-border bg-card">
          <div className="flex items-center gap-1 border-b border-divider px-2.5 py-2">
            <PlatformChip active={platform === 'all'} onClick={() => { setPlatform('all'); setAccountId('all') }} title="全部平台">
              <Layers size={14} />
            </PlatformChip>
            {(Object.keys(CHANNELS) as Channel[]).map((ch) => (
              <PlatformChip key={ch} active={platform === ch} onClick={() => { setPlatform(ch); setAccountId('all') }} title={CHANNELS[ch].label} disabled={!accounts.some((a) => a.channel === ch)}>
                <ChannelIcon channel={ch} size={14} />
              </PlatformChip>
            ))}
          </div>
          <div className="flex items-center justify-between px-3 pb-1.5 pt-3">
            <span className="text-xs font-semibold text-stone-500">
              {platform === 'all' ? '全部' : CHANNELS[platform].label} 账号 {platformAccounts.length}
            </span>
            <Link to="/accounts" className="flex items-center gap-0.5 rounded-md border border-line/45 px-1.5 py-0.5 text-[11px] font-medium text-line-text no-underline hover:bg-line-dark/50">
              <Plus size={11} /> 添加
            </Link>
          </div>
          <div className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
            <button
              onClick={() => setAccountId('all')}
              className={clsx('flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-[13px]', accountId === 'all' ? 'bg-[#E7F7ED] font-semibold text-[#123C28]' : 'text-stone-600 hover:bg-stone-50')}
            >
              <MessagesSquare size={15} className="shrink-0" />
              全部账号
              <span className="tnum ml-auto text-[11px] text-stone-400">{conversations.filter((c) => platform === 'all' || accounts.find((a) => a.id === c.accountId)?.channel === platform).length}</span>
            </button>
            {platformAccounts.map((a) => {
              const st = ACCOUNT_STATUS[a.status]
              const ag = agents.find((g) => g.id === a.agentId)
              const pend = pendingByAccount(a.id)
              const active = a.id === accountId
              return (
                <button
                  key={a.id}
                  onClick={() => setAccountId(a.id)}
                  className={clsx('group relative flex min-h-[72px] w-full flex-col justify-center rounded-xl px-2.5 py-2 text-left transition-colors', active ? 'bg-[#E7F7ED] text-[#123C28]' : 'hover:bg-stone-50')}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={clsx('h-2 w-2 shrink-0 rounded-full', st.dot)} />
                    <span className={clsx('truncate text-[13px]', active ? 'font-semibold' : 'font-medium')}>{a.name}</span>
                    {pend > 0 && <span className="tnum ml-auto rounded-full bg-warn px-1.5 text-[10px] font-semibold leading-4 text-white">{pend}</span>}
                  </span>
                  <span className="mt-0.5 pl-3.5 text-[11px] text-stone-500">
                    {st.label} · {a.friends.toLocaleString()} 个好友
                  </span>
                  <span className={clsx('mt-1 ml-3.5 inline-flex w-fit max-w-[140px] items-center gap-1 truncate rounded-md px-1.5 py-px text-[10.5px]', ag ? (ag.status === 'active' ? 'bg-ai-bg text-ai-text' : 'bg-stone-100 text-stone-500') : 'bg-warn-bg text-warn')}>
                    <Bot size={10} className="shrink-0" />
                    {ag ? `${ag.name}${ag.status === 'active' ? '' : ' · 已暂停'}` : '未绑定 AI'}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="flex w-[288px] shrink-0 flex-col border-r border-border bg-card">
          <div className="space-y-2.5 px-3 pb-2.5 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="truncate text-sm font-semibold">{account ? account.name : platform === 'all' ? '全部会话' : `${CHANNELS[platform].label} 会话`}</span>
              <span className="tnum shrink-0 text-xs text-stone-400">{scoped.length} 个会话</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="input h-8 pl-8 text-[13px]" placeholder="搜索会话 / 客户 / 编号" />
            </div>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={clsx(
                    'flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs transition-colors',
                    filter === f.key ? 'bg-line-dark font-semibold text-line-text' : 'text-stone-500 hover:bg-stone-50',
                  )}
                >
                  {f.label}
                  <span className={clsx('tnum', f.key === 'pending' && count(f.key) > 0 && filter !== f.key ? 'font-semibold text-warn' : 'opacity-70')}>{count(f.key)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                disabled={!toManual.length}
                onClick={() => batch('manual')}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-warn/40 bg-warn-bg/60 py-1.5 text-xs font-medium text-warn transition-opacity disabled:opacity-40"
              >
                <Headset size={13} /> 全部转人工 <span className="tnum">{toManual.length}</span>
              </button>
              <button
                disabled={!toAi.length}
                onClick={() => batch('ai')}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line/40 bg-line-dark/50 py-1.5 text-xs font-medium text-line-text transition-opacity disabled:opacity-40"
              >
                <Sparkles size={13} /> 全部转 AI <span className="tnum">{toAi.length}</span>
              </button>
            </div>
            {account && (
              <button onClick={() => setAiModal(true)} className="flex w-full items-center gap-2 rounded-lg border border-border bg-card2 px-2.5 py-2 text-left hover:border-ai/40">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ai-bg text-ai">
                  <Bot size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-stone-400">当前账号 AI 设置</span>
                  <span className="block truncate text-xs font-medium">{accountAgent ? `${accountAgent.name} · ${accountAgent.role}` : '未绑定，进线客户全部转人工'}</span>
                </span>
                <ChevronRight size={14} className="text-stone-400" />
              </button>
            )}
          </div>
          <div className="scroll-thin flex-1 overflow-y-auto border-t border-divider">
            {rows.length === 0 && <Empty icon={<MessagesSquare size={20} />} title="没有符合条件的会话" desc="换个账号或筛选条件试试" />}
            {rows.map(({ conv, contact, last }) => {
              const active = conv.id === selectedId
              const rc = RECEPTION[conv.mode]
              const acc = accounts.find((a) => a.id === conv.accountId)
              return (
                <button
                  key={conv.id}
                  onClick={() => setParams({ c: conv.id })}
                  className={clsx('flex w-full gap-2.5 border-b border-divider px-3 py-3 text-left transition-colors', active ? 'bg-line-dark/60' : 'hover:bg-stone-50')}
                >
                  <span className="relative shrink-0">
                    <Avatar name={contact.name} color={contact.color} size={36} />
                    {conv.unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-danger" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-medium">{contact.name}</span>
                      <Flag flag={contact.flag} />
                      {conv.starred && <Star size={11} className="shrink-0 fill-amber-400 text-amber-400" />}
                      <span className={clsx('ml-auto shrink-0 rounded px-1.5 py-px text-[10.5px] font-semibold', rc.cls)}>{rc.label}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[12.5px] text-stone-500">
                      <span className="min-w-0 flex-1 truncate">
                        {last?.from === 'ai' && <span className="text-ai-text">AI：</span>}
                        {last?.from === 'agent' && <span className="text-line-text">我：</span>}
                        {last?.from === 'customer' ? last.translated ?? last.text : last?.text}
                      </span>
                      <span className="tnum shrink-0 text-[11px] text-stone-400">{relTime(conv.lastMessageAt)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                      <span className={clsx('h-1.5 w-1.5 rounded-full', stageMeta(contact.stage).dot)} />
                      {stageMeta(contact.stage).label}
                      {accountId === 'all' && acc && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span className="truncate">{acc.name}</span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {selected ? (
          <>
            <ChatPane key={selected.id} convId={selected.id} draft={draft} setDraft={setDraft} rightOpen={rightOpen} onToggleRight={() => setRightOpen((v) => !v)} />
            {rightOpen && <RightWorkspace key={`r-${selected.id}`} convId={selected.id} onInsert={setDraft} />}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Empty icon={<MessagesSquare size={20} />} title="选择一个会话开始" />
          </div>
        )}
      </div>
      {account && <AccountAiModal open={aiModal} onClose={() => setAiModal(false)} accountId={account.id} />}
    </>
  )
}

function PlatformChip({ active, onClick, title, disabled, children }: { active: boolean; onClick: () => void; title: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-30',
        active ? 'bg-ink text-white [&_svg]:text-white' : 'text-stone-500 hover:bg-stone-100',
      )}
    >
      {children}
    </button>
  )
}
