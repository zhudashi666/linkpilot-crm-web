import type { AiAgent, Contact, Stage } from '../types'
import { STAGES } from './meta'

export type Intent = 'price' | 'sample' | 'shipping' | 'complaint' | 'human' | 'bulk' | 'other'

export interface CustomerPreset {
  intent: Intent
  label: string
  text: string
  zh: string
}

export const CUSTOMER_PRESETS: CustomerPreset[] = [
  { intent: 'price', label: '询问价格', text: 'What is the price for 50 units? Do you have a better price for bulk?', zh: '50 台多少钱？批量有更优惠的价格吗？' },
  { intent: 'sample', label: '要样品', text: 'Can I get 2 samples first to test the quality?', zh: '可以先拿 2 台样品测试质量吗？' },
  { intent: 'shipping', label: '物流咨询', text: 'How long does shipping take to my country? Is customs included?', zh: '发到我们国家要多久？包清关吗？' },
  { intent: 'bulk', label: '大单报价', text: 'We need 300 units for a government project, please send your best offer.', zh: '我们有个政府项目需要 300 台，请给最优报价。' },
  { intent: 'complaint', label: '投诉退款', text: 'The unit stopped working after 3 days. I want a refund now!', zh: '机器用了 3 天就坏了，我现在就要退款！' },
  { intent: 'human', label: '要求人工', text: 'Can I talk to a real person please?', zh: '我能和真人聊吗？' },
]

export function detectIntent(text: string): Intent {
  const t = text.toLowerCase()
  if (/(refund|broken|stopped working|complain|退款|投诉|坏了|差评)/.test(t)) return 'complaint'
  if (/(real person|human|人工|真人|manager)/.test(t)) return 'human'
  if (/(\b[2-9]\d{2,}\b|300|500|1000).*(unit|台|pcs)|government|project|大单/.test(t)) return 'bulk'
  if (/(price|cost|quote|precio|preço|价格|多少钱|报价)/.test(t)) return 'price'
  if (/(sample|muestra|amostra|样品)/.test(t)) return 'sample'
  if (/(ship|deliver|custom|envío|frete|物流|发货|清关|运费)/.test(t)) return 'shipping'
  return 'other'
}

export interface PlannedAction {
  type: 'add_tag' | 'update_stage' | 'update_field' | 'create_task' | 'handoff'
  label: string
  detail: string
  payload: Record<string, string>
}

export interface AiDecision {
  reply?: { text: string; zh: string }
  actions: PlannedAction[]
  confidence: number
  handoffReason?: string
  intent: Intent
  knowledgeHits: string[]
}

const stageIdx = (s: Stage) => STAGES.findIndex((x) => x.key === s)

function advance(contact: Contact, agent: AiAgent, to: Stage): PlannedAction | null {
  if (!agent.writeback.stage) return null
  const target = stageIdx(to) > stageIdx(agent.writeback.maxStage) ? agent.writeback.maxStage : to
  if (stageIdx(target) <= stageIdx(contact.stage)) return null
  const from = STAGES[stageIdx(contact.stage)].label
  return { type: 'update_stage', label: '推进阶段', detail: `${from} → ${STAGES[stageIdx(target)].label}`, payload: { from: contact.stage, to: target } }
}

function tag(contact: Contact, agent: AiAgent, t: string): PlannedAction | null {
  if (!agent.writeback.tags || contact.tags.includes(t)) return null
  return { type: 'add_tag', label: '添加标签', detail: t, payload: { tag: t } }
}

export function decide(intent: Intent, contact: Contact, agent: AiAgent): AiDecision {
  const first = contact.name.split(' ')[0]
  const acts: (PlannedAction | null)[] = []
  let d: AiDecision

  switch (intent) {
    case 'price':
      acts.push(tag(contact, agent, '询价-批发'), advance(contact, agent, 'qualified'))
      if (agent.writeback.fields) acts.push({ type: 'update_field', label: '填写字段', detail: '采购产品 = SV-2000 × 50', payload: { field: 'product', value: 'SV-2000 × 50' } })
      d = {
        reply: {
          text: `Hi ${first}! For 50 units the SV-2000 is US$ 268/unit FOB Shenzhen (tier 2). From 100 units it drops to US$ 249. Which port should I quote CIF to?`,
          zh: `你好 ${first}！50 台 SV-2000 的 FOB 深圳价是每台 268 美元（第二档），100 台起降到 249 美元。需要我按哪个港口报 CIF 价？`,
        },
        actions: [],
        confidence: 0.86,
        intent,
        knowledgeHits: ['批发价格阶梯表（FOB/CIF）.xlsx', 'SolarVolt 2026 产品目录.pdf'],
      }
      break
    case 'sample':
      acts.push(tag(contact, agent, '要样品'), advance(contact, agent, 'qualified'))
      if (agent.writeback.tasks) acts.push({ type: 'create_task', label: '创建任务', detail: `给 ${first} 寄出 2 台样品`, payload: { title: `给 ${first} 寄出 2 台样品并同步快递单号` } })
      d = {
        reply: {
          text: `Sure ${first}! Samples are charged at unit price + shipping, and the sample fee is refunded on your first order of 50+ units. Could you share your delivery address?`,
          zh: `没问题 ${first}！样品按单价 + 运费收取，首单满 50 台时退还样品费。方便发一下收货地址吗？`,
        },
        actions: [],
        confidence: 0.81,
        intent,
        knowledgeHits: ['常见问题 FAQ'],
      }
      break
    case 'shipping':
      acts.push(tag(contact, agent, '物流咨询'), advance(contact, agent, 'contacted'))
      d = {
        reply: {
          text: `Sea freight usually takes 25-35 days, air express 5-8 days. We can do DDP (duties included) for most countries. Which city is it going to?`,
          zh: `海运一般 25-35 天，空运快递 5-8 天。大部分国家可以做 DDP（包税）。请问发往哪个城市？`,
        },
        actions: [],
        confidence: 0.78,
        intent,
        knowledgeHits: ['拉美物流与清关指南.docx'],
      }
      break
    case 'bulk':
      acts.push(tag(contact, agent, '高意向'), advance(contact, agent, 'qualified'))
      if (agent.writeback.fields) acts.push({ type: 'update_field', label: '填写字段', detail: '预算 = 300 台政府项目', payload: { field: 'budget', value: '300 台 · 政府项目' } })
      d = {
        reply: {
          text: `Thank you ${first}, that's a great project. I'm connecting you with our senior sales manager who will prepare a dedicated offer within 2 hours.`,
          zh: `谢谢 ${first}，这是个很好的项目。我马上为您对接高级销售经理，2 小时内给您专属报价。`,
        },
        actions: [],
        confidence: 0.9,
        intent,
        knowledgeHits: ['批发价格阶梯表（FOB/CIF）.xlsx'],
      }
      if (agent.handoff.onQuote) d.handoffReason = `大单报价 · 预估金额超过 $${agent.handoff.dealOver.toLocaleString()}`
      break
    case 'complaint':
      acts.push(tag(contact, agent, '投诉'))
      d = {
        reply: {
          text: `I'm really sorry about this, ${first}. I've escalated your case to our after-sales team and a colleague will reply in a few minutes.`,
          zh: `非常抱歉 ${first}。我已把您的问题升级给售后团队，同事几分钟内会回复您。`,
        },
        actions: [],
        confidence: 0.92,
        intent,
        knowledgeHits: ['常见问题 FAQ'],
      }
      if (agent.handoff.onComplaint) d.handoffReason = '客户投诉 · 退款诉求'
      break
    case 'human':
      d = {
        reply: { text: `Of course! Connecting you to a colleague now, please hold on.`, zh: `好的！正在为您转接同事，请稍等。` },
        actions: [],
        confidence: 0.95,
        intent,
        knowledgeHits: [],
      }
      if (agent.handoff.onRequestHuman) d.handoffReason = '客户要求人工'
      break
    default:
      d = {
        reply: {
          text: `Thanks for your message, ${first}! Let me check that for you.`,
          zh: `感谢您的消息 ${first}！我帮您确认一下。`,
        },
        actions: [],
        confidence: 0.46,
        intent,
        knowledgeHits: [],
      }
      if (agent.handoff.lowConfidence && d.confidence < agent.handoff.confidenceThreshold) {
        d.handoffReason = `知识库未命中 · 置信度 ${d.confidence.toFixed(2)} 低于阈值 ${agent.handoff.confidenceThreshold}`
        d.reply = undefined
      }
  }

  d.actions = acts.filter((a): a is PlannedAction => !!a)
  if (d.handoffReason) d.actions.push({ type: 'handoff', label: '转人工', detail: d.handoffReason, payload: {} })
  return d
}

export const SUGGESTIONS: Record<Intent, string[]> = {
  price: ['50 台的单价是 268 美元 FOB 深圳，100 台起 249 美元。', '我先发您一份完整的阶梯报价单，方便您对比。', '请问您希望按哪个港口报 CIF 价？'],
  sample: ['样品可以安排，样品费在首单满 50 台时退还。', '方便发一下收货地址和联系电话吗？', '样品一般 3 个工作日内发出。'],
  shipping: ['海运 25-35 天，空运 5-8 天，可以做 DDP 包税。', '请问发往哪个城市？我帮您算运费。', '我们在当地有合作清关行，不用您操心。'],
  bulk: ['感谢信任，我这边 2 小时内给您专属报价。', '政府项目我们有投标资质文件，可以一起发您。', '请问项目的交付时间节点是？'],
  complaint: ['非常抱歉给您带来不便，我马上为您处理。', '我们可以先为您安排免费换新，退款也可以。', '能拍一段机器故障的视频给我吗？'],
  human: ['您好，我是销售经理，有什么可以帮您？', '我已看过之前的聊天记录，我们继续。', '您方便语音沟通吗？'],
  other: ['好的，我确认后马上回复您。', '请问还有其他问题吗？', '我把产品目录发给您参考。'],
}
