import type { Intent } from '../../lib/ai-sim'
import type { AiPlatform, Channel, ConversationMode } from '../../types'

export const RECEPTION: Record<ConversationMode, { label: string; cls: string }> = {
  ai: { label: 'AI', cls: 'bg-line-dark text-line-text' },
  pending: { label: '待人工', cls: 'bg-warn-bg text-warn' },
  manual: { label: '人工', cls: 'bg-danger/10 text-danger' },
  closed: { label: '已结束', cls: 'bg-stone-100 text-stone-500' },
}

export const INTENT_LABEL: Record<Intent, string> = {
  price: '询价',
  sample: '索要样品',
  shipping: '物流 / 清关',
  bulk: '大单报价',
  complaint: '投诉 / 售后',
  human: '要求人工',
  other: '一般咨询',
}

export const CHANNEL_PLATFORM: Record<Channel, AiPlatform | null> = {
  whatsapp: 'WhatsApp',
  line: 'LINE',
  telegram: 'Telegram',
  messenger: null,
}

export const ACCOUNT_STATUS: Record<string, { label: string; dot: string }> = {
  online: { label: '在线', dot: 'bg-line' },
  warming: { label: '养号中', dot: 'bg-info' },
  offline: { label: '离线', dot: 'bg-warn' },
  banned: { label: '已封禁', dot: 'bg-danger' },
}
