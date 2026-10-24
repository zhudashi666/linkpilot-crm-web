import { useNavigate } from 'react-router-dom'
import { BellRing, X } from 'lucide-react'
import { useStore } from '../store'
import { Flag } from './ui'

export function HandoffAlert() {
  const convId = useStore((s) => s.handoffAlert)
  const conv = useStore((s) => s.conversations.find((c) => c.id === convId))
  const contact = useStore((s) => s.contacts.find((c) => c.id === conv?.contactId))
  const account = useStore((s) => s.accounts.find((a) => a.id === conv?.accountId))
  const { dismissHandoff, setMode } = useStore()
  const navigate = useNavigate()

  if (!conv || !contact || conv.mode !== 'pending') return null

  const handle = () => {
    setMode(conv.id, 'manual')
    dismissHandoff()
    navigate(`/inbox?c=${conv.id}`)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] animate-pop-in rounded-2xl border border-warn/30 bg-card p-4 shadow-elevated">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warn-bg text-warn">
          <BellRing size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">AI 无法处理，已自动转人工</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
            {contact.name} <Flag flag={contact.flag} /> · {account?.name} · 请及时接待
          </p>
        </div>
        <button onClick={dismissHandoff} className="rounded-md p-1 text-stone-400 hover:bg-stone-100" aria-label="关闭">
          <X size={15} />
        </button>
      </div>
      <p className="mt-3 rounded-lg bg-warn-bg/60 px-3 py-2 text-[12.5px] text-warn">原因：{conv.handoffReason ?? '客户需要人工协助'}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={dismissHandoff} className="btn btn-ghost h-8 px-3 text-xs">
          稍后
        </button>
        <button onClick={handle} className="btn btn-primary h-8 px-3 text-xs">
          立即处理
        </button>
      </div>
    </div>
  )
}
