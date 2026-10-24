export type Channel = 'whatsapp' | 'line' | 'telegram' | 'messenger'

export type Stage = 'new' | 'contacted' | 'qualified' | 'quoted' | 'negotiating' | 'won' | 'lost'

export interface Member {
  id: string
  name: string
  role: '管理员' | '销售主管' | '销售' | '客服'
  color: string
  online: boolean
  email: string
}

export interface ChannelAccount {
  id: string
  channel: Channel
  name: string
  handle: string
  status: 'online' | 'offline' | 'banned' | 'warming'
  health: number
  proxy: string
  proxyRegion: string
  agentId: string | null
  ownerId: string
  todayChats: number
  friends: number
  createdAt: number
}

export interface Contact {
  id: string
  name: string
  color: string
  channel: Channel
  accountId: string
  handle: string
  country: string
  flag: string
  language: string
  source: string
  tags: string[]
  stage: Stage
  ownerId: string
  dealValue: number
  intent: number
  fields: {
    company?: string
    product?: string
    budget?: string
    email?: string
  }
  summary: string
  lastActiveAt: number
  createdAt: number
}

export type ConversationMode = 'ai' | 'pending' | 'manual' | 'closed'

export interface Conversation {
  id: string
  contactId: string
  accountId: string
  mode: ConversationMode
  unread: number
  lastMessageAt: number
  handoffReason?: string
  assigneeId?: string
  starred?: boolean
}

export type Sender = 'customer' | 'ai' | 'agent' | 'system'

export interface Message {
  id: string
  conversationId: string
  from: Sender
  text: string
  translated?: string
  time: number
  agentName?: string
  actionIds?: string[]
}

export type AiActionType = 'add_tag' | 'update_stage' | 'update_field' | 'create_task' | 'handoff'

export interface AiAction {
  id: string
  type: AiActionType
  label: string
  detail: string
  contactId: string
  conversationId?: string
  agentId: string
  time: number
  status: 'applied' | 'reverted' | 'pending_review'
  payload: Record<string, string>
}

export interface Task {
  id: string
  contactId: string
  title: string
  due: number
  done: boolean
  ownerId: string
  createdBy: 'ai' | 'user' | 'sop'
}

export interface Campaign {
  id: string
  name: string
  channel: Channel
  audienceDesc: string
  audience: number
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'done'
  sent: number
  delivered: number
  replied: number
  variants: number
  ratePerMin: number
  scheduledAt: number
  createdAt: number
}

export interface SopStep {
  id: string
  day: number
  hour: number
  content: string
  aiPersonalize: boolean
}

export interface SopFlow {
  id: string
  name: string
  trigger: string
  enabled: boolean
  enrolled: number
  replyRate: number
  steps: SopStep[]
}

export interface TrafficLink {
  id: string
  name: string
  slug: string
  channel: Channel
  accountIds: string[]
  strategy: 'round_robin' | 'weighted' | 'least_load'
  clicks: number
  newContacts: number
  enabled: boolean
  createdAt: number
}

/** AI 客服渠道：IM（客服工作台）+ 社媒（社媒工作台） */
export type AiPlatform = 'LINE' | 'WhatsApp' | 'Telegram' | 'Tinder' | 'Bumble' | 'Soul'

export interface PersonaFields {
  publicName: string
  familiarName: string
  fullName: string
  age: string
  city: string
  occupation: string
  currentStatus: string
}

/** 平台公共预设模板（只读）；企业基于它追加角色资料创建自己的 AI 客服 */
export interface AiTemplate {
  id: string
  name: string
  platform: AiPlatform
  regionCode: string
  description: string
  rolePrompt: string
}

export interface AiAgent {
  id: string
  name: string
  avatar: string
  /** 用途介绍（≤20 字），列表与其他页面作为岗位副标题展示 */
  role: string
  platform: AiPlatform
  regionCode: string
  /** 来源公共模板；空串 = 空白创建 */
  templateId: string
  /** 基于模板创建时的结构化角色资料；空白创建为 undefined，使用 rolePrompt 自由文本 */
  personaFields?: PersonaFields
  rolePrompt: string
  /** 空白创建 = 业务资料；基于模板 = 不希望 AI 回复的事情 */
  businessPrompt: string
  creator: string
  updatedAt: number
  status: 'active' | 'paused'
  handoff: {
    lowConfidence: boolean
    confidenceThreshold: number
    onQuote: boolean
    onComplaint: boolean
    onRequestHuman: boolean
    dealOver: number
  }
  writeback: {
    tags: boolean
    stage: boolean
    maxStage: Stage
    fields: boolean
    tasks: boolean
    reviewRequired: boolean
  }
  stats: { receptions: number; autoRate: number; conversion: number; csat: number }
}

export type KnowledgeSource = 'document' | 'web' | 'manual'

/** 企业全局资料：每份资料可关联最多 10 个 AI 客服（自定义客服或公共模板） */
export interface KnowledgeDoc {
  id: string
  name: string
  source: KnowledgeSource
  /** 文档 = 文件名 · 大小；网页 = URL；手工 = 空 */
  detail: string
  body?: string
  assistantIds: string[]
  templateIds: string[]
  updatedAt: number
}

export type PlanKey = 'basic' | 'pro' | 'enterprise'

export interface Billing {
  plan: PlanKey
  seats: number
  expiresAt: number
  points: number
  /** 本计费周期已消耗的算力点 */
  cycleUsed: number
  agentUsage: Record<string, { replies: number; points: number }>
  /** 按渠道账号（= 席位）统计的本周期消耗 */
  accountUsage: Record<string, { replies: number; points: number }>
}

export type OrderKind = 'seats' | 'renew' | 'points' | 'upgrade'
export type PayMethod = 'wechat' | 'alipay' | 'usdt'

export interface Order {
  id: string
  kind: OrderKind
  seats?: number
  months?: number
  points?: number
  plan?: PlanKey
  amountUsd: number
  method: PayMethod
  status: 'pending' | 'done' | 'rejected'
  createdAt: number
  doneAt?: number
}

export interface UsageRecord {
  id: string
  time: number
  /** ai_reply = AI 托管自动回复；ai_assist = 人工接待时用 AI 助手生成回复；translate = 人工消息翻译 */
  kind: 'ai_reply' | 'ai_assist' | 'translate'
  points: number
  contactId: string
  agentId?: string
  memberId?: string
}

export interface UsageDay {
  date: number
  ai: number
  translate: number
}
