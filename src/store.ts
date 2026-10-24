import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createSeed, members, CURRENT_USER_ID, type SeedData } from './data/seed'
import { decide, detectIntent, SUGGESTIONS, type Intent } from './lib/ai-sim'
import { T, uid, STAGES } from './lib/meta'
import { PRICING } from './lib/billing'
import type { AgentDraft } from './lib/ai-customer'
import type {
  AiAction,
  AiAgent,
  Campaign,
  ChannelAccount,
  Contact,
  ConversationMode,
  KnowledgeDoc,
  Message,
  Order,
  SopFlow,
  Stage,
  Task,
  TrafficLink,
  UsageRecord,
} from './types'

const INBOUND_LEADS = [
  { name: 'Diego Ramírez', color: '#0EA5E9', handle: '+52 55 4471 0932', country: '墨西哥', flag: '🇲🇽', language: '西班牙语', text: 'Hola, vi su anuncio. ¿Cuál es el precio del SV-2000 por 20 unidades?', zh: '你好，看到你们的广告。SV-2000 买 20 台什么价格？' },
  { name: 'Mariana Costa', color: '#F97316', handle: '+55 11 98820 4419', country: '巴西', flag: '🇧🇷', language: '葡萄牙语', text: 'Oi! Vocês enviam para São Paulo? Quanto tempo demora o frete?', zh: '你好！能发到圣保罗吗？运输要多久？' },
  { name: 'Omar Haddad', color: '#8B5CF6', handle: '+971 55 310 7781', country: '阿联酋', flag: '🇦🇪', language: '阿拉伯语', text: 'Can I get 2 samples first to test the quality?', zh: '可以先拿 2 台样品测试质量吗？' },
  { name: 'Nguyen Van Minh', color: '#10B981', handle: '+84 90 221 6630', country: '越南', flag: '🇻🇳', language: '越南语', text: 'We need 300 units for a government project, please send your best offer.', zh: '我们有个政府项目需要 300 台，请给最优报价。' },
]

export type BillingModal = 'seats' | 'renew' | 'points' | 'upgrade' | null

interface Toast {
  id: string
  text: string
  tone: 'success' | 'info' | 'warn'
}

interface State extends SeedData {
  typing: Record<string, boolean>
  lastIntent: Record<string, Intent>
  flash: Record<string, number>
  toasts: Toast[]
  billingModal: BillingModal
  /** AI 转人工时弹出的右下角提醒（会话 id） */
  handoffAlert: string | null

  dismissHandoff: () => void
  /** 批量切换接待方式（全部转人工 / 全部转 AI），返回实际切换的会话数 */
  bulkSetMode: (convIds: string[], mode: 'ai' | 'manual') => number
  /** 演示：广告 / 分流链接带来一个新客户，自动建档并由账号绑定的 AI 客服接待，返回会话 id */
  simulateInbound: (accountId?: string) => string | null
  /** 人工接待时调用 AI 助手生成回复建议，按算力扣费；余额不足返回 null */
  aiAssist: (convId: string, guidance: string) => string | null

  openBilling: (m: BillingModal) => void
  createOrder: (o: Omit<Order, 'id' | 'status' | 'createdAt'>) => string
  confirmOrder: (id: string) => void
  consume: (r: Omit<UsageRecord, 'id' | 'time'>) => boolean

  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
  reset: () => void

  markRead: (convId: string) => void
  setMode: (convId: string, mode: ConversationMode, reason?: string) => void
  toggleStar: (convId: string) => void
  sendAgentMessage: (convId: string, text: string) => void
  customerSays: (convId: string, text: string, zh?: string) => void

  updateContact: (id: string, patch: Partial<Contact>) => void
  updateContactField: (id: string, field: keyof Contact['fields'], value: string) => void
  addTag: (id: string, tag: string) => void
  removeTag: (id: string, tag: string) => void
  setStage: (id: string, stage: Stage) => void
  bulkTag: (ids: string[], tag: string) => void
  bulkAssign: (ids: string[], ownerId: string) => void

  revertAction: (id: string) => void
  approveAction: (id: string) => void

  addTask: (t: Omit<Task, 'id' | 'done'>) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void

  addCampaign: (c: Omit<Campaign, 'id' | 'createdAt' | 'sent' | 'delivered' | 'replied'>) => void
  setCampaignStatus: (id: string, status: Campaign['status']) => void

  toggleSop: (id: string) => void
  saveSop: (sop: SopFlow) => void

  addLink: (l: Omit<TrafficLink, 'id' | 'clicks' | 'newContacts' | 'createdAt'>) => void
  toggleLink: (id: string) => void

  addAccount: (a: Omit<ChannelAccount, 'id' | 'createdAt' | 'todayChats' | 'friends' | 'health'>) => void
  updateAccount: (id: string, patch: Partial<ChannelAccount>) => void
  removeAccount: (id: string) => void

  /** 新建或保存 AI 客服，返回 id */
  saveAgent: (d: AgentDraft) => string
  toggleAgentStatus: (id: string) => void
  /** 删除 AI 客服：同时解绑渠道账号、移除知识关联，返回被解绑的账号数 */
  removeAgent: (id: string) => number

  addKnowledge: (k: Pick<KnowledgeDoc, 'name' | 'source' | 'detail' | 'body'>) => void
  updateKnowledge: (id: string, patch: Partial<Pick<KnowledgeDoc, 'name' | 'body'>>) => void
  setKnowledgeLinks: (id: string, assistantIds: string[], templateIds: string[]) => void
}

const me = members.find((m) => m.id === CURRENT_USER_ID)!

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...createSeed(),
      typing: {},
      lastIntent: {},
      flash: {},
      toasts: [],
      billingModal: null,
      handoffAlert: null,

      dismissHandoff: () => set({ handoffAlert: null }),

      bulkSetMode: (convIds, mode) => {
        const targets = get().conversations.filter((c) => convIds.includes(c.id) && c.mode !== 'closed' && (mode === 'ai' ? c.mode !== 'ai' : c.mode !== 'manual'))
        const t = Date.now()
        const text = mode === 'ai' ? `${me.name} 批量将会话交还给 AI 接待` : `${me.name} 批量接管了会话，AI 已暂停自动回复`
        set((s) => ({
          conversations: s.conversations.map((c) =>
            targets.some((x) => x.id === c.id) ? { ...c, mode, handoffReason: undefined, assigneeId: mode === 'manual' ? me.id : c.assigneeId } : c,
          ),
          messages: [...s.messages, ...targets.map((c, i) => ({ id: uid('msg'), conversationId: c.id, from: 'system' as const, text, time: t + i }))],
        }))
        return targets.length
      },

      simulateInbound: (accountId) => {
        const st = get()
        const account = accountId
          ? st.accounts.find((a) => a.id === accountId)
          : st.accounts.find((a) => a.status === 'online' && a.agentId && st.agents.some((g) => g.id === a.agentId && g.status === 'active'))
        if (!account || account.status === 'banned') return null
        const link = st.links.find((l) => l.enabled && l.accountIds.includes(account.id))
        const lead = INBOUND_LEADS[st.contacts.length % INBOUND_LEADS.length]
        const t = Date.now()
        const contact: Contact = {
          id: uid('c'),
          name: lead.name,
          color: lead.color,
          channel: account.channel,
          accountId: account.id,
          handle: lead.handle,
          country: lead.country,
          flag: lead.flag,
          language: lead.language,
          source: link?.name ?? `${account.name} 自然进线`,
          tags: ['新进线'],
          stage: 'new',
          ownerId: account.ownerId,
          dealValue: 0,
          intent: 30,
          fields: {},
          summary: '新进线客户，AI 正在接待并补全资料。',
          lastActiveAt: t,
          createdAt: t,
        }
        const agent = st.agents.find((g) => g.id === account.agentId && g.status === 'active')
        const conv = {
          id: uid('cv'),
          contactId: contact.id,
          accountId: account.id,
          mode: (agent ? 'ai' : 'pending') as ConversationMode,
          unread: 0,
          lastMessageAt: t,
          handoffReason: agent ? undefined : '该账号未绑定运行中的 AI 客服',
        }
        set((s) => ({
          contacts: [contact, ...s.contacts],
          conversations: [conv, ...s.conversations],
          links: link ? s.links.map((l) => (l.id === link.id ? { ...l, clicks: l.clicks + 1, newContacts: l.newContacts + 1 } : l)) : s.links,
          messages: [...s.messages, { id: uid('msg'), conversationId: conv.id, from: 'system', text: `新客户通过「${contact.source}」进线，已自动建档并分配给负责人`, time: t }],
        }))
        get().customerSays(conv.id, lead.text, lead.zh)
        if (!agent) set({ handoffAlert: conv.id })
        return conv.id
      },

      aiAssist: (convId, guidance) => {
        const st = get()
        const conv = st.conversations.find((c) => c.id === convId)
        if (!conv) return null
        if (!st.consume({ kind: 'ai_assist', points: PRICING.replyPoints, contactId: conv.contactId, memberId: me.id })) {
          get().toast('算力余额不足，AI 助手暂不可用', 'warn')
          return null
        }
        const intent = st.lastIntent[convId] ?? detectIntent([...st.messages].reverse().find((m) => m.conversationId === convId && m.from === 'customer')?.text ?? '')
        const pool = SUGGESTIONS[intent]
        const base = pool[Math.floor(Math.random() * pool.length)]
        const g = guidance.trim()
        if (!g) return base
        if (/简短|短一点|简洁/.test(g)) return base.split(/[，。]/)[0] + '。'
        if (/热情|亲切|友好/.test(g)) return `太感谢您的关注了！${base}有任何问题随时找我 😊`
        if (/专业|正式/.test(g)) return `您好，关于您的问题：${base}如需书面资料，我可以随时发送给您。`
        return `${base}（已按要求「${g}」调整）`
      },

      openBilling: (m) => set({ billingModal: m }),

      createOrder: (o) => {
        const d = new Date()
        const id = `PO${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(Math.floor(100 + Math.random() * 900))}`
        set((s) => ({ orders: [{ ...o, id, status: 'pending', createdAt: Date.now() }, ...s.orders] }))
        return id
      },

      confirmOrder: (id) => {
        const o = get().orders.find((x) => x.id === id)
        if (!o || o.status !== 'pending') return
        set((s) => {
          const b = { ...s.billing }
          if (o.kind === 'seats') b.seats += o.seats ?? 0
          if (o.kind === 'renew') b.expiresAt = Math.max(b.expiresAt, Date.now()) + (o.months ?? 1) * 30 * T.DAY
          if (o.kind === 'points') b.points += o.points ?? 0
          if (o.kind === 'upgrade' && o.plan) b.plan = o.plan
          return { billing: b, orders: s.orders.map((x) => (x.id === id ? { ...x, status: 'done', doneAt: Date.now() } : x)) }
        })
        get().toast(`订单 ${id} 已确认到账`)
      },

      consume: (r) => {
        if (get().billing.points < r.points) return false
        const t = Date.now()
        set((s) => {
          const day0 = new Date(t).setHours(0, 0, 0, 0)
          const daily = [...s.usageDaily]
          const last = daily[daily.length - 1]
          const key = r.kind === 'translate' ? 'translate' : 'ai'
          if (last && last.date === day0) daily[daily.length - 1] = { ...last, [key]: last[key] + r.points }
          else daily.push({ date: day0, ai: 0, translate: 0, [key]: r.points })
          const agentUsage = { ...s.billing.agentUsage }
          if (r.agentId) {
            const prev = agentUsage[r.agentId] ?? { replies: 0, points: 0 }
            agentUsage[r.agentId] = { replies: prev.replies + 1, points: prev.points + r.points }
          }
          const accountUsage = { ...s.billing.accountUsage }
          const accountId = s.contacts.find((c) => c.id === r.contactId)?.accountId
          if (accountId) {
            const prev = accountUsage[accountId] ?? { replies: 0, points: 0 }
            accountUsage[accountId] = { replies: prev.replies + (r.kind === 'translate' ? 0 : 1), points: prev.points + r.points }
          }
          return {
            billing: { ...s.billing, points: s.billing.points - r.points, cycleUsed: s.billing.cycleUsed + r.points, agentUsage, accountUsage },
            usage: [{ ...r, id: uid('u'), time: t }, ...s.usage].slice(0, 200),
            usageDaily: daily.slice(-14),
          }
        })
        return true
      },

      toast: (text, tone = 'success') => {
        const id = uid('toast')
        set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }))
        setTimeout(() => get().dismissToast(id), 2600)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      reset: () => set({ ...createSeed(), typing: {}, lastIntent: {}, flash: {} }),

      markRead: (convId) =>
        set((s) => ({ conversations: s.conversations.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)) })),

      setMode: (convId, mode, reason) => {
        const sysText: Record<ConversationMode, string> = {
          manual: `${me.name} 接管了会话，AI 已暂停自动回复`,
          ai: `${me.name} 将会话交还给 AI 接待`,
          pending: `会话已转入待人工队列${reason ? '：' + reason : ''}`,
          closed: `${me.name} 结束了会话`,
        }
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  mode,
                  handoffReason: mode === 'pending' ? reason ?? c.handoffReason : undefined,
                  assigneeId: mode === 'manual' ? me.id : c.assigneeId,
                }
              : c,
          ),
          messages: [
            ...s.messages,
            { id: uid('msg'), conversationId: convId, from: 'system', text: sysText[mode], time: Date.now() },
          ],
        }))
      },

      toggleStar: (convId) =>
        set((s) => ({ conversations: s.conversations.map((c) => (c.id === convId ? { ...c, starred: !c.starred } : c)) })),

      sendAgentMessage: (convId, text) => {
        const msg: Message = {
          id: uid('msg'),
          conversationId: convId,
          from: 'agent',
          text,
          translated: '已自动翻译为客户语言发送',
          time: Date.now(),
          agentName: me.name,
        }
        const conv = get().conversations.find((c) => c.id === convId)
        if (conv && !get().consume({ kind: 'translate', points: PRICING.translatePoints, contactId: conv.contactId, memberId: me.id })) {
          msg.translated = '算力不足，未翻译，按原文发送'
        }
        set((s) => ({
          messages: [...s.messages, msg],
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, lastMessageAt: msg.time, unread: 0 } : c,
          ),
        }))
      },

      customerSays: (convId, text, zh) => {
        const st = get()
        const conv = st.conversations.find((c) => c.id === convId)
        if (!conv) return
        const intent = detectIntent(text + ' ' + (zh ?? ''))
        const now = Date.now()
        set((s) => ({
          messages: [
            ...s.messages,
            { id: uid('msg'), conversationId: convId, from: 'customer', text, translated: zh ?? '（自动翻译）' + text, time: now },
          ],
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, lastMessageAt: now, unread: c.unread + 1, mode: c.mode === 'closed' ? 'ai' : c.mode } : c,
          ),
          contacts: s.contacts.map((c) => (c.id === conv.contactId ? { ...c, lastActiveAt: now } : c)),
          lastIntent: { ...s.lastIntent, [convId]: intent },
        }))

        const mode = get().conversations.find((c) => c.id === convId)!.mode
        const account = st.accounts.find((a) => a.id === conv.accountId)
        const agent = st.agents.find((a) => a.id === account?.agentId)
        if (mode !== 'ai' || !agent || agent.status !== 'active') return

        if (get().billing.points < PRICING.replyPoints) {
          get().setMode(convId, 'pending', '算力余额不足，AI 已暂停接待')
          set({ handoffAlert: convId })
          return
        }

        set((s) => ({ typing: { ...s.typing, [convId]: true } }))
        setTimeout(() => {
          const s0 = get()
          const contact = s0.contacts.find((c) => c.id === conv.contactId)!
          if (!s0.consume({ kind: 'ai_reply', points: PRICING.replyPoints, contactId: contact.id, agentId: agent.id })) {
            set((s) => ({ typing: { ...s.typing, [convId]: false }, handoffAlert: convId }))
            get().setMode(convId, 'pending', '算力余额不足，AI 已暂停接待')
            return
          }
          const d = decide(intent, contact, agent)
          const t = Date.now()
          const review = agent.writeback.reviewRequired
          const actions: AiAction[] = d.actions.map((a) => ({
            id: uid('ac'),
            type: a.type,
            label: a.label,
            detail: a.detail,
            contactId: contact.id,
            conversationId: convId,
            agentId: agent.id,
            time: t,
            status: review && a.type !== 'handoff' ? 'pending_review' : 'applied',
            payload: { ...a.payload },
          }))

          let next: Contact = { ...contact, fields: { ...contact.fields }, tags: [...contact.tags] }
          const newTasks: Task[] = []
          for (const a of actions) {
            if (a.status !== 'applied') continue
            if (a.type === 'add_tag') next.tags.push(a.payload.tag)
            if (a.type === 'update_stage') next.stage = a.payload.to as Stage
            if (a.type === 'update_field') next.fields[a.payload.field as keyof Contact['fields']] = a.payload.value
            if (a.type === 'create_task') {
              const task: Task = { id: uid('t'), contactId: contact.id, title: a.payload.title, due: t + T.DAY, done: false, ownerId: contact.ownerId, createdBy: 'ai' }
              a.payload.taskId = task.id
              newTasks.push(task)
            }
          }

          const newMsgs: Message[] = []
          if (d.reply) {
            newMsgs.push({ id: uid('msg'), conversationId: convId, from: 'ai', text: d.reply.text, translated: d.reply.zh, time: t, agentName: agent.name, actionIds: actions.filter((a) => a.type !== 'handoff').map((a) => a.id) })
          }
          const handoff = actions.find((a) => a.type === 'handoff')
          if (handoff) {
            newMsgs.push({ id: uid('msg'), conversationId: convId, from: 'system', text: `AI 已暂停自动回复并转人工：${d.handoffReason}`, time: t + 1, actionIds: [handoff.id] })
          }

          set((s) => ({
            typing: { ...s.typing, [convId]: false },
            contacts: s.contacts.map((c) => (c.id === contact.id ? next : c)),
            aiActions: [...actions, ...s.aiActions],
            tasks: [...newTasks, ...s.tasks],
            messages: [...s.messages, ...newMsgs],
            flash: { ...s.flash, [contact.id]: t },
            conversations: s.conversations.map((c) =>
              c.id === convId
                ? { ...c, lastMessageAt: t, mode: handoff ? 'pending' : c.mode, handoffReason: handoff ? d.handoffReason : c.handoffReason }
                : c,
            ),
            handoffAlert: handoff ? convId : s.handoffAlert,
          }))
        }, 1400)
      },

      updateContact: (id, patch) => set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      updateContactField: (id, field, value) =>
        set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, fields: { ...c.fields, [field]: value } } : c)) })),
      addTag: (id, tag) =>
        set((s) => ({ contacts: s.contacts.map((c) => (c.id === id && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c)) })),
      removeTag: (id, tag) =>
        set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c)) })),
      setStage: (id, stage) => {
        set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, stage } : c)) }))
      },
      bulkTag: (ids, tag) =>
        set((s) => ({ contacts: s.contacts.map((c) => (ids.includes(c.id) && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c)) })),
      bulkAssign: (ids, ownerId) =>
        set((s) => ({ contacts: s.contacts.map((c) => (ids.includes(c.id) ? { ...c, ownerId } : c)) })),

      revertAction: (id) => {
        const a = get().aiActions.find((x) => x.id === id)
        if (!a || a.status !== 'applied') return
        set((s) => {
          let contacts = s.contacts
          let tasks = s.tasks
          let conversations = s.conversations
          const upd = (fn: (c: Contact) => Contact) => (contacts = contacts.map((c) => (c.id === a.contactId ? fn(c) : c)))
          if (a.type === 'add_tag') upd((c) => ({ ...c, tags: c.tags.filter((t) => t !== a.payload.tag) }))
          if (a.type === 'update_stage') upd((c) => ({ ...c, stage: a.payload.from as Stage }))
          if (a.type === 'update_field') upd((c) => ({ ...c, fields: { ...c.fields, [a.payload.field]: '' } }))
          if (a.type === 'create_task') tasks = tasks.filter((t) => t.id !== a.payload.taskId)
          if (a.type === 'handoff') conversations = conversations.map((c) => (c.id === a.conversationId ? { ...c, mode: 'ai', handoffReason: undefined } : c))
          return { contacts, tasks, conversations, aiActions: s.aiActions.map((x) => (x.id === id ? { ...x, status: 'reverted' } : x)) }
        })
        get().toast('已撤销 AI 动作', 'info')
      },

      approveAction: (id) => {
        const a = get().aiActions.find((x) => x.id === id)
        if (!a || a.status !== 'pending_review') return
        set((s) => {
          let contacts = s.contacts
          let tasks = s.tasks
          const upd = (fn: (c: Contact) => Contact) => (contacts = contacts.map((c) => (c.id === a.contactId ? fn(c) : c)))
          if (a.type === 'add_tag') upd((c) => (c.tags.includes(a.payload.tag) ? c : { ...c, tags: [...c.tags, a.payload.tag] }))
          if (a.type === 'update_stage') upd((c) => ({ ...c, stage: a.payload.to as Stage }))
          if (a.type === 'update_field') upd((c) => ({ ...c, fields: { ...c.fields, [a.payload.field]: a.payload.value } }))
          const payload = { ...a.payload }
          if (a.type === 'create_task') {
            const contact = s.contacts.find((c) => c.id === a.contactId)
            const task: Task = { id: uid('t'), contactId: a.contactId, title: a.payload.title, due: Date.now() + T.DAY, done: false, ownerId: contact?.ownerId ?? me.id, createdBy: 'ai' }
            payload.taskId = task.id
            tasks = [task, ...tasks]
          }
          return { contacts, tasks, aiActions: s.aiActions.map((x) => (x.id === id ? { ...x, status: 'applied', payload } : x)) }
        })
        get().toast('已确认并执行 AI 动作')
      },

      addTask: (t) => set((s) => ({ tasks: [{ ...t, id: uid('t'), done: false }, ...s.tasks] })),
      toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addCampaign: (c) =>
        set((s) => ({ campaigns: [{ ...c, id: uid('cp'), createdAt: Date.now(), sent: 0, delivered: 0, replied: 0 }, ...s.campaigns] })),
      setCampaignStatus: (id, status) => set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status } : c)) })),

      toggleSop: (id) => set((s) => ({ sops: s.sops.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)) })),
      saveSop: (sop) =>
        set((s) => ({ sops: s.sops.some((x) => x.id === sop.id) ? s.sops.map((x) => (x.id === sop.id ? sop : x)) : [sop, ...s.sops] })),

      addLink: (l) => set((s) => ({ links: [{ ...l, id: uid('l'), clicks: 0, newContacts: 0, createdAt: Date.now() }, ...s.links] })),
      toggleLink: (id) => set((s) => ({ links: s.links.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)) })),

      addAccount: (a) =>
        set((s) => ({ accounts: [{ ...a, id: uid('a'), createdAt: Date.now(), todayChats: 0, friends: 0, health: 60 }, ...s.accounts] })),
      updateAccount: (id, patch) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      saveAgent: (d) => {
        const { isNew, ...fields } = d
        const base = {
          ...fields,
          name: fields.name.trim(),
          role: fields.role.trim(),
          updatedAt: Date.now(),
        }
        if (!isNew) {
          set((s) => ({ agents: s.agents.map((x) => (x.id === d.id ? { ...x, ...base } : x)) }))
          return d.id
        }
        const id = uid('ag')
        const palette = ['#187965', '#b45309', '#4f46e5', '#be185d', '#0369a1', '#7c3aed', '#0f766e']
        const created: AiAgent = {
          ...base,
          id,
          avatar: palette[get().agents.length % palette.length],
          creator: me.name,
          stats: { receptions: 0, autoRate: 0, conversion: 0, csat: 0 },
        }
        // 基于公共模板创建时，继承模板已关联的知识资料
        set((s) => ({
          agents: [...s.agents, created],
          knowledge: d.templateId
            ? s.knowledge.map((k) => (k.templateIds.includes(d.templateId) && k.assistantIds.length < 10 ? { ...k, assistantIds: [...k.assistantIds, id] } : k))
            : s.knowledge,
        }))
        return id
      },
      toggleAgentStatus: (id) =>
        set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active', updatedAt: Date.now() } : a)) })),
      removeAgent: (id) => {
        const affected = get().accounts.filter((a) => a.agentId === id).length
        set((s) => ({
          agents: s.agents.filter((a) => a.id !== id),
          accounts: s.accounts.map((a) => (a.agentId === id ? { ...a, agentId: null } : a)),
          knowledge: s.knowledge.map((k) => (k.assistantIds.includes(id) ? { ...k, assistantIds: k.assistantIds.filter((x) => x !== id) } : k)),
        }))
        return affected
      },

      addKnowledge: (k) => set((s) => ({ knowledge: [{ ...k, id: uid('k'), assistantIds: [], templateIds: [], updatedAt: Date.now() }, ...s.knowledge] })),
      updateKnowledge: (id, patch) => set((s) => ({ knowledge: s.knowledge.map((k) => (k.id === id ? { ...k, ...patch, updatedAt: Date.now() } : k)) })),
      setKnowledgeLinks: (id, assistantIds, templateIds) =>
        set((s) => ({ knowledge: s.knowledge.map((k) => (k.id === id ? { ...k, assistantIds, templateIds, updatedAt: Date.now() } : k)) })),
    }),
    {
      name: 'linkpilot-crm-demo',
      version: 4,
      migrate: () => createSeed() as unknown as State,
      partialize: (s) => {
        const { typing, toasts, flash, billingModal, handoffAlert, ...rest } = s
        void typing
        void toasts
        void flash
        void billingModal
        void handoffAlert
        return rest
      },
    },
  ),
)

export const useMembers = () => members
export const currentUser = me
export const stageOrder = STAGES.map((s) => s.key)
