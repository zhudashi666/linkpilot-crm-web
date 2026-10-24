import type { OrderKind, PayMethod, PlanKey } from '../types'
import { T } from './meta'

/** 与 AI 客服后台的平台定价保持一致，正式版由平台运营后台统一调价 */
export const PRICING = {
  pointsPerUsd: 72_000,
  replyPoints: 1_000,
  translatePoints: 100,
  usdtRateCny: 7.2,
  lowBalancePoints: 216_000,
}

export const PLANS: Record<
  PlanKey,
  { name: string; seatUsd: number; desc: string; agents: string; members: string; features: string[] }
> = {
  basic: {
    name: '基础版',
    seatUsd: 9,
    desc: '多账号聚合聊天 + 实时翻译 + 客户管理',
    agents: '1 个 AI 客服',
    members: '5 个子账号',
    features: ['多渠道聚合会话', '双向实时翻译', '客户档案与标签', '销售管道'],
  },
  pro: {
    name: '专业版',
    seatUsd: 12,
    desc: 'AI 客服自动接待并回写 CRM，适合成长期团队',
    agents: '5 个 AI 客服',
    members: '20 个子账号',
    features: ['基础版全部功能', 'AI 客服自动接待', 'AI 回写 CRM + 审核', '群发 / SOP / 分流链接', '数据分析'],
  },
  enterprise: {
    name: '企业版',
    seatUsd: 15,
    desc: '不限 AI 客服、私有知识库与专属客户成功经理',
    agents: '不限 AI 客服',
    members: '不限子账号',
    features: ['专业版全部功能', 'API / Webhook', '操作审计日志', '离职交接与数据导出管控', '专属客户成功经理'],
  },
}

export const POINT_PACKS = [
  { usd: 10, bonus: 0 },
  { usd: 50, bonus: 0.05 },
  { usd: 100, bonus: 0.1 },
  { usd: 500, bonus: 0.15 },
]

export const RENEW_OPTIONS = [
  { months: 1, discount: 0 },
  { months: 3, discount: 0.05 },
  { months: 6, discount: 0.1 },
  { months: 12, discount: 0.2 },
]

export const PAY_METHODS: { key: PayMethod; label: string; hint: string; color: string }[] = [
  { key: 'wechat', label: '微信支付', hint: '打开微信扫一扫完成支付', color: '#07c160' },
  { key: 'alipay', label: '支付宝', hint: '打开支付宝扫一扫完成支付', color: '#1677ff' },
  { key: 'usdt', label: 'USDT (TRC20)', hint: '按订单生成的 TRC20 地址转入对应金额', color: '#26a17b' },
]

export const ORDER_KIND_LABEL: Record<OrderKind, string> = {
  seats: '增购席位',
  renew: '套餐续费',
  points: '充值算力',
  upgrade: '升级套餐',
}

export const fmtPoints = (n: number) => Math.round(n).toLocaleString('en-US')
export const fmtUsd = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const usdToCny = (usd: number) => '¥' + (usd * PRICING.usdtRateCny).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const pointsToUsd = (points: number) => points / PRICING.pointsPerUsd

export const daysLeft = (expiresAt: number) => Math.max(0, Math.ceil((expiresAt - Date.now()) / T.DAY))

/** 增购席位按到期日剩余天数折算 */
export const seatProrateUsd = (qty: number, seatUsd: number, expiresAt: number) =>
  Math.round(qty * seatUsd * (daysLeft(expiresAt) / 30) * 100) / 100
