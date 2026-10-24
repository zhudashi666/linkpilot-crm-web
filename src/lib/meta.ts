import type { Channel, ConversationMode, Stage } from '../types'

export const STAGES: { key: Stage; label: string; color: string; dot: string }[] = [
  { key: 'new', label: '新线索', color: 'bg-stone-50 text-stone-500 ring-stone-200', dot: 'bg-stone-400' },
  { key: 'contacted', label: '已接触', color: 'bg-blue-50 text-blue-600 ring-blue-600/20', dot: 'bg-blue-500' },
  { key: 'qualified', label: '需求确认', color: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20', dot: 'bg-cyan-500' },
  { key: 'quoted', label: '已报价', color: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  { key: 'negotiating', label: '谈判中', color: 'bg-orange-50 text-orange-700 ring-orange-600/20', dot: 'bg-orange-500' },
  { key: 'won', label: '已成交', color: 'bg-brand-50 text-brand-700 ring-brand-500/20', dot: 'bg-brand-500' },
  { key: 'lost', label: '已流失', color: 'bg-red-50 text-red-600 ring-red-600/20', dot: 'bg-red-400' },
]

export const stageMeta = (s: Stage) => STAGES.find((x) => x.key === s)!

export const CHANNELS: Record<Channel, { label: string; color: string; bg: string }> = {
  whatsapp: { label: 'WhatsApp', color: '#1fa855', bg: 'bg-[#e8f8ee]' },
  line: { label: 'LINE', color: '#06c755', bg: 'bg-[#e6f9ee]' },
  telegram: { label: 'Telegram', color: '#2aa3df', bg: 'bg-[#e6f4fb]' },
  messenger: { label: 'Messenger', color: '#7b5cf5', bg: 'bg-[#efebfe]' },
}

export const MODE_META: Record<ConversationMode, { label: string; cls: string }> = {
  ai: { label: 'AI 接待中', cls: 'bg-ai-bg text-ai-text ring-ai/20' },
  pending: { label: '待人工接管', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  manual: { label: '人工处理中', cls: 'bg-brand-50 text-brand-700 ring-brand-500/20' },
  closed: { label: '已结束', cls: 'bg-stone-50 text-stone-500 ring-stone-200' },
}

export const TAG_POOL = [
  '询价-批发',
  '询价-零售',
  '高意向',
  '价格敏感',
  '要样品',
  '物流咨询',
  '售后',
  '老客户',
  '代理商',
  '沉睡客户',
  'Facebook 广告',
  'TikTok 引流',
  '投诉',
]

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
export const T = { MIN, HOUR, DAY }

export function relTime(ts: number) {
  const d = Date.now() - ts
  if (d < 0) {
    const f = -d
    if (f < HOUR) return `${Math.max(1, Math.round(f / MIN))} 分钟后`
    if (f < DAY) return `${Math.round(f / HOUR)} 小时后`
    return `${Math.round(f / DAY)} 天后`
  }
  if (d < MIN) return '刚刚'
  if (d < HOUR) return `${Math.floor(d / MIN)} 分钟前`
  if (d < DAY) return `${Math.floor(d / HOUR)} 小时前`
  if (d < 30 * DAY) return `${Math.floor(d / DAY)} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

export function clock(ts: number) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function dateTime(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${clock(ts)}`
}

export function fmtTime(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${clock(ts)}`
}

export const money = (n: number) => '$' + n.toLocaleString('en-US')

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`
