import type {
  AiAction,
  AiAgent,
  AiTemplate,
  Billing,
  Campaign,
  ChannelAccount,
  Contact,
  Conversation,
  KnowledgeDoc,
  Member,
  Message,
  Order,
  SopFlow,
  Task,
  TrafficLink,
  UsageDay,
  UsageRecord,
} from '../types'
import { T } from '../lib/meta'

const now = () => Date.now()

export const members: Member[] = [
  { id: 'm1', name: '周景行', role: '管理员', color: '#187965', online: true, email: 'zhou@linkpilot.io' },
  { id: 'm2', name: '林晚秋', role: '销售主管', color: '#b45309', online: true, email: 'lin@linkpilot.io' },
  { id: 'm3', name: '陈一帆', role: '销售', color: '#4f46e5', online: true, email: 'chen@linkpilot.io' },
  { id: 'm4', name: '许嘉宁', role: '销售', color: '#be185d', online: false, email: 'xu@linkpilot.io' },
  { id: 'm5', name: '何素', role: '客服', color: '#0369a1', online: true, email: 'he@linkpilot.io' },
]

export const CURRENT_USER_ID = 'm1'

export function createSeed() {
  const n = now()

  const accounts: ChannelAccount[] = [
    { id: 'a1', channel: 'whatsapp', name: '拉美批发-01', handle: '+52 55 8123 4471', status: 'online', health: 92, proxy: 'res-mx-031', proxyRegion: '墨西哥城', agentId: 'ag1', ownerId: 'm3', todayChats: 47, friends: 1832, createdAt: n - 120 * T.DAY },
    { id: 'a2', channel: 'whatsapp', name: '拉美批发-02', handle: '+55 11 9734 2208', status: 'online', health: 78, proxy: 'res-br-114', proxyRegion: '圣保罗', agentId: 'ag1', ownerId: 'm3', todayChats: 39, friends: 1407, createdAt: n - 96 * T.DAY },
    { id: 'a3', channel: 'whatsapp', name: '中东零售-01', handle: '+966 55 310 8842', status: 'warming', health: 64, proxy: 'res-sa-009', proxyRegion: '利雅得', agentId: 'ag2', ownerId: 'm4', todayChats: 12, friends: 211, createdAt: n - 6 * T.DAY },
    { id: 'a4', channel: 'whatsapp', name: '东南亚-印尼', handle: '+62 812 7720 1934', status: 'banned', health: 8, proxy: 'res-id-052', proxyRegion: '雅加达', agentId: null, ownerId: 'm4', todayChats: 0, friends: 964, createdAt: n - 60 * T.DAY },
    { id: 'a5', channel: 'line', name: '日本官方号', handle: '@solarvolt_jp', status: 'online', health: 96, proxy: 'dc-jp-002', proxyRegion: '东京', agentId: 'ag3', ownerId: 'm2', todayChats: 28, friends: 3120, createdAt: n - 200 * T.DAY },
    { id: 'a6', channel: 'line', name: '泰国代理群', handle: '@solarvolt_th', status: 'online', health: 88, proxy: 'res-th-017', proxyRegion: '曼谷', agentId: 'ag3', ownerId: 'm2', todayChats: 19, friends: 870, createdAt: n - 150 * T.DAY },
    { id: 'a7', channel: 'telegram', name: '欧洲 B2B', handle: '@solarvolt_eu', status: 'online', health: 90, proxy: 'dc-de-008', proxyRegion: '法兰克福', agentId: 'ag4', ownerId: 'm3', todayChats: 15, friends: 642, createdAt: n - 88 * T.DAY },
    { id: 'a8', channel: 'messenger', name: 'FB 主页客服', handle: 'SolarVolt Official', status: 'offline', health: 71, proxy: 'dc-us-021', proxyRegion: '洛杉矶', agentId: 'ag1', ownerId: 'm5', todayChats: 0, friends: 5210, createdAt: n - 300 * T.DAY },
  ]




  const templates: AiTemplate[] = [
    { id: 'tpl-mx-wa-sales', name: '拉美批发销售顾问', platform: 'WhatsApp', regionCode: 'MX', description: '批发询价、阶梯报价与交期确认，西语热情接待。', rolePrompt: '识别批发 / 零售身份，问清数量、目标价与收货国家，批发客户引导进入报价环节。' },
    { id: 'tpl-mx-wa-cs', name: '售后与物流跟进', platform: 'WhatsApp', regionCode: 'MX', description: '物流查询、清关进度与售后保修答复。', rolePrompt: '先收集订单号与收货城市，再根据物流节点给出预计时效；保修问题按政策答复。' },
    { id: 'tpl-ae-wa-b2b', name: '中东 B2B 询盘接待', platform: 'WhatsApp', regionCode: 'AE', description: '经销商 / 工程商身份识别，认证与清关答疑。', rolePrompt: '专业简洁，优先确认公司名称与年采购量，认证问题依据 SASO / CE 资料回答。' },
    { id: 'tpl-us-wa-retail', name: '北美零售客服', platform: 'WhatsApp', regionCode: 'US', description: '零售售前咨询、优惠码与下单引导。', rolePrompt: '友好口语化，推荐合适型号并附购买链接，价格只引用官方售价。' },
    { id: 'tpl-br-wa-retail', name: '巴西零售咨询', platform: 'WhatsApp', regionCode: 'BR', description: '葡语零售咨询，包税与配送说明。', rolePrompt: '用葡语回复，说明包税政策与配送时效，引导客户留下 CPF 与收货地址。' },
    { id: 'tpl-jp-line-cs', name: '日系礼貌售前售后', platform: 'LINE', regionCode: 'JP', description: '敬语接待，售前选型与保修受理。', rolePrompt: '全程使用敬语，售前推荐型号，售后先确认购买渠道与订单号再说明保修流程。' },
    { id: 'tpl-jp-line-sales', name: '新品种草导购', platform: 'LINE', regionCode: 'JP', description: '新品介绍与限时活动推送后的答疑。', rolePrompt: '围绕新品卖点答疑，提醒活动截止时间，不夸大续航与功率参数。' },
    { id: 'tpl-th-line-agent', name: '泰国代理商对接', platform: 'LINE', regionCode: 'TH', description: '代理政策、返点与区域保护说明。', rolePrompt: '介绍代理政策与返点阶梯，区域独家等条款只说明需与销售经理确认。' },
    { id: 'tpl-de-tg-b2b', name: '欧洲 B2B 技术顾问', platform: 'Telegram', regionCode: 'DE', description: '参数选型、CE 认证与欧盟仓发货。', rolePrompt: '技术导向，回答功率、容量与认证问题，欧盟仓库存以实时资料为准。' },
    { id: 'tpl-us-tinder', name: '社媒破冰引流', platform: 'Tinder', regionCode: 'US', description: '自然破冰聊天，兴趣匹配后引导到 WhatsApp。', rolePrompt: '轻松自然地聊户外与旅行话题，建立信任后再提供 WhatsApp 联系方式。' },
    { id: 'tpl-us-bumble', name: '兴趣社群沟通', platform: 'Bumble', regionCode: 'US', description: '露营 / 自驾兴趣话题沟通与社群邀请。', rolePrompt: '以露营爱好者身份交流装备经验，适时邀请加入社群，不主动推销。' },
    { id: 'tpl-tw-soul', name: '台湾社媒陪聊引流', platform: 'Soul', regionCode: 'TW', description: '繁体中文轻松聊天，引导到 LINE 好友。', rolePrompt: '使用繁体中文，语气温和，聊生活与户外话题，熟悉后引导添加 LINE。' },
  ]

  const agents: AiAgent[] = [
    {
      id: 'ag1',
      name: 'Sofía',
      avatar: '#187965',
      role: '拉美批发询价与报价',
      platform: 'WhatsApp',
      regionCode: 'MX',
      templateId: 'tpl-mx-wa-sales',
      personaFields: { publicName: 'Sofía', familiarName: 'Sofi', fullName: 'Sofía Ramírez Torres', age: '28', city: '墨西哥城', occupation: 'SolarVolt 拉美区销售顾问', currentStatus: '负责墨西哥、巴西、哥伦比亚的批发客户，熟悉 SV 系列储能电源与太阳能板，优先使用客户母语（西语 / 葡语）。' },
      rolePrompt: '',
      businessPrompt: '不承诺独家代理权；不报低于第三档的价格；不讨论竞品负面信息。',
      creator: '周景行',
      updatedAt: n - 2 * T.DAY,
      status: 'active',
      handoff: { lowConfidence: true, confidenceThreshold: 0.6, onQuote: true, onComplaint: true, onRequestHuman: true, dealOver: 5000 },
      writeback: { tags: true, stage: true, maxStage: 'qualified', fields: true, tasks: true, reviewRequired: false },
      stats: { receptions: 3842, autoRate: 81.4, conversion: 12.7, csat: 4.6 },
    },
    {
      id: 'ag2',
      name: 'Adam',
      avatar: '#b45309',
      role: '中东经销商开发',
      platform: 'WhatsApp',
      regionCode: 'AE',
      templateId: '',
      rolePrompt: '你是 SolarVolt 的 B2B 业务代表 Adam，常驻迪拜，专业、简洁，熟悉 CE / UL / SASO 认证和海湾国家清关流程。目标：识别经销商 / 工程商身份，收集公司名称与年采购量，引导索取目录与样品。',
      businessPrompt: '报价只引用价格阶梯表；样品费政策：2 台以内收取成本价，下首单后抵扣；交期 25–35 天。不得承诺付款账期。',
      creator: '林晚秋',
      updatedAt: n - 6 * T.DAY,
      status: 'active',
      handoff: { lowConfidence: true, confidenceThreshold: 0.7, onQuote: true, onComplaint: true, onRequestHuman: true, dealOver: 10000 },
      writeback: { tags: true, stage: true, maxStage: 'qualified', fields: true, tasks: true, reviewRequired: true },
      stats: { receptions: 1206, autoRate: 74.9, conversion: 9.3, csat: 4.4 },
    },
    {
      id: 'ag3',
      name: 'さくら',
      avatar: '#be185d',
      role: '日本零售售前与保修',
      platform: 'LINE',
      regionCode: 'JP',
      templateId: 'tpl-jp-line-cs',
      personaFields: { publicName: 'さくら', familiarName: 'さくらちゃん', fullName: '佐々木 さくら', age: '26', city: '东京', occupation: 'SolarVolt 日本官方客服', currentStatus: '负责 LINE 官方号与泰国代理群的零售咨询，售后问题收集订单号后转人工。' },
      rolePrompt: '',
      businessPrompt: '不透露未发布新品信息；不承诺超出保修政策的免费维修。',
      creator: '林晚秋',
      updatedAt: n - 11 * T.DAY,
      status: 'paused',
      handoff: { lowConfidence: true, confidenceThreshold: 0.55, onQuote: false, onComplaint: true, onRequestHuman: true, dealOver: 3000 },
      writeback: { tags: true, stage: false, maxStage: 'contacted', fields: true, tasks: false, reviewRequired: false },
      stats: { receptions: 2271, autoRate: 88.2, conversion: 6.1, csat: 4.8 },
    },
    {
      id: 'ag4',
      name: 'Lena',
      avatar: '#0369a1',
      role: '欧洲 B2B 技术答疑',
      platform: 'Telegram',
      regionCode: 'DE',
      templateId: 'tpl-de-tg-b2b',
      personaFields: { publicName: 'Lena', familiarName: 'Lena', fullName: 'Lena Hoffmann', age: '31', city: '法兰克福', occupation: 'SolarVolt 欧洲技术销售', currentStatus: '负责德国、荷兰、波兰的工程商与分销商，擅长储能系统选型。' },
      rolePrompt: '',
      businessPrompt: '欧盟仓库存以资料为准，不确定时请客户稍候由同事确认。',
      creator: '周景行',
      updatedAt: n - 4 * T.DAY,
      status: 'active',
      handoff: { lowConfidence: true, confidenceThreshold: 0.65, onQuote: true, onComplaint: true, onRequestHuman: true, dealOver: 8000 },
      writeback: { tags: true, stage: true, maxStage: 'qualified', fields: true, tasks: true, reviewRequired: false },
      stats: { receptions: 486, autoRate: 77.2, conversion: 8.4, csat: 4.5 },
    },
  ]

  const knowledge: KnowledgeDoc[] = [
    { id: 'k1', name: 'SolarVolt 2026 产品目录', source: 'document', detail: 'SolarVolt-2026-Catalog.pdf · 8.4 MB', assistantIds: ['ag1', 'ag2', 'ag3', 'ag4'], templateIds: ['tpl-mx-wa-sales', 'tpl-jp-line-cs'], updatedAt: n - 3 * T.DAY },
    { id: 'k2', name: '批发价格阶梯表 FOB/CIF', source: 'document', detail: 'price-tiers-2026Q4.xlsx · 96 KB', assistantIds: ['ag1', 'ag2'], templateIds: ['tpl-mx-wa-sales', 'tpl-ae-wa-b2b'], updatedAt: n - 1 * T.DAY },
    { id: 'k3', name: '常见问题 FAQ', source: 'manual', detail: '', body: 'Q：SV-2000 能带动多大功率的电器？\nA：持续输出 2000W，峰值 4000W，可带动电饭煲、电钻、小型空调等。\n\nQ：充满电需要多久？\nA：市电快充约 1.5 小时充满；搭配 400W 太阳能板约 6 小时。\n\nQ：保修多久？\nA：整机 3 年保修，电池 10 年 / 3500 次循环质保。', assistantIds: ['ag1', 'ag3'], templateIds: ['tpl-jp-line-cs'], updatedAt: n - 5 * T.HOUR },
    { id: 'k4', name: '认证证书说明 CE/UL/SASO', source: 'document', detail: 'certifications.docx · 1.2 MB', assistantIds: ['ag2', 'ag4'], templateIds: ['tpl-ae-wa-b2b', 'tpl-de-tg-b2b'], updatedAt: n - 20 * T.DAY },
    { id: 'k5', name: '拉美物流与清关指南', source: 'document', detail: 'latam-logistics.docx · 640 KB', assistantIds: ['ag1'], templateIds: ['tpl-mx-wa-sales', 'tpl-mx-wa-cs'], updatedAt: n - 9 * T.DAY },
    { id: 'k6', name: 'B2B 官网合作页', source: 'web', detail: 'https://solarvolt.com/b2b', assistantIds: ['ag2', 'ag4'], templateIds: [], updatedAt: n - 10 * T.MIN },
    { id: 'k7', name: '日本保修政策', source: 'document', detail: 'jp-warranty.pdf · 410 KB', assistantIds: ['ag3'], templateIds: ['tpl-jp-line-cs'], updatedAt: n - 40 * T.DAY },
    { id: 'k8', name: '退换货标准话术', source: 'manual', detail: '', body: '1. 签收 7 天内可无理由退货，需保持外包装完整。\n2. 质量问题 30 天内可换新，运费由我方承担。\n3. 退款原路返回，3–5 个工作日到账。', assistantIds: ['ag1'], templateIds: ['tpl-mx-wa-cs'], updatedAt: n - 2 * T.DAY },
  ]

  type C = Omit<Contact, 'color'> & { color?: string }
  const palette = ['#187965', '#b45309', '#4f46e5', '#be185d', '#0369a1', '#7c3aed', '#a16207', '#15803d', '#c2410c', '#0f766e']
  const raw: C[] = [
    { id: 'c1', name: 'Carlos Méndez', channel: 'whatsapp', accountId: 'a1', handle: '+52 33 1987 6620', country: '墨西哥', flag: '🇲🇽', language: '西班牙语', source: 'FB 广告-墨西哥批发', tags: ['询价-批发', '高意向'], stage: 'qualified', ownerId: 'm3', dealValue: 18600, intent: 86, fields: { company: 'Energía Libre S.A.', product: 'SV-2000 储能电源', budget: '约 $18k', email: 'carlos@energialibre.mx' }, summary: '墨西哥瓜达拉哈拉的经销商，计划首单 60 台 SV-2000，关注 CIF 曼萨尼约价格和交期，希望 3 月前到货。', lastActiveAt: n - 2 * T.MIN, createdAt: n - 4 * T.DAY },
    { id: 'c2', name: 'Ana Paula Ribeiro', channel: 'whatsapp', accountId: 'a2', handle: '+55 21 99812 3307', country: '巴西', flag: '🇧🇷', language: '葡萄牙语', source: 'TikTok 引流链接', tags: ['询价-零售', '价格敏感'], stage: 'contacted', ownerId: 'm3', dealValue: 1200, intent: 54, fields: { product: 'SV-600 便携电源' }, summary: '个人买家，露营用途，对比了亚马逊价格，询问巴西是否包税。', lastActiveAt: n - 9 * T.MIN, createdAt: n - 1 * T.DAY },
    { id: 'c3', name: 'Faisal Al-Harbi', channel: 'whatsapp', accountId: 'a3', handle: '+966 50 771 2049', country: '沙特', flag: '🇸🇦', language: '阿拉伯语', source: '展会二维码', tags: ['代理商', '要样品'], stage: 'quoted', ownerId: 'm4', dealValue: 42000, intent: 78, fields: { company: 'Al-Harbi Trading', product: 'SV-3600 + 太阳能板套装', budget: '$40k-45k' }, summary: '利雅得工程商，要求 SASO 认证和阿语说明书，已发报价单 V2，等待对方确认样品费。', lastActiveAt: n - 26 * T.MIN, createdAt: n - 12 * T.DAY },
    { id: 'c4', name: '佐藤 健太', channel: 'line', accountId: 'a5', handle: 'kenta_sato', country: '日本', flag: '🇯🇵', language: '日语', source: 'LINE 官方号', tags: ['售后', '老客户'], stage: 'won', ownerId: 'm2', dealValue: 890, intent: 40, fields: { product: 'SV-1000', email: 'k.sato@mail.jp' }, summary: '去年购买 SV-1000，反馈充电口松动，已在保修期内，需要寄修地址。', lastActiveAt: n - 41 * T.MIN, createdAt: n - 210 * T.DAY },
    { id: 'c5', name: 'Somchai Wongsakul', channel: 'line', accountId: 'a6', handle: 'somchai.w', country: '泰国', flag: '🇹🇭', language: '泰语', source: '泰国代理群', tags: ['代理商', '询价-批发'], stage: 'negotiating', ownerId: 'm2', dealValue: 26500, intent: 81, fields: { company: 'Siam Power Co.', product: 'SV-2000', budget: '$25k' }, summary: '曼谷区域代理，要求独家代理权和 5% 返点，价格已让到第二档。', lastActiveAt: n - 2 * T.HOUR, createdAt: n - 30 * T.DAY },
    { id: 'c6', name: 'Lukas Hoffmann', channel: 'telegram', accountId: 'a7', handle: '@lukas_hfm', country: '德国', flag: '🇩🇪', language: '德语', source: '官网 B2B 页', tags: ['询价-批发'], stage: 'qualified', ownerId: 'm3', dealValue: 15800, intent: 69, fields: { company: 'Hoffmann Camping GmbH', product: 'SV-1000 / SV-2000' }, summary: '德国户外用品连锁，关注 CE 和 WEEE 合规，希望先拿 20 台试单。', lastActiveAt: n - 3 * T.HOUR, createdAt: n - 6 * T.DAY },
    { id: 'c7', name: 'Diego Torres', channel: 'whatsapp', accountId: 'a1', handle: '+57 310 662 0418', country: '哥伦比亚', flag: '🇨🇴', language: '西班牙语', source: 'FB 广告-墨西哥批发', tags: ['物流咨询'], stage: 'new', ownerId: 'm3', dealValue: 0, intent: 32, fields: {}, summary: '刚添加好友，询问能否发到波哥大。', lastActiveAt: n - 4 * T.MIN, createdAt: n - 30 * T.MIN },
    { id: 'c8', name: 'Maria Santos', channel: 'whatsapp', accountId: 'a2', handle: '+55 11 98420 7713', country: '巴西', flag: '🇧🇷', language: '葡萄牙语', source: 'TikTok 引流链接', tags: ['投诉', '售后'], stage: 'won', ownerId: 'm5', dealValue: 640, intent: 20, fields: { product: 'SV-600' }, summary: '物流延误 12 天，情绪激动，要求退款，AI 已转人工。', lastActiveAt: n - 15 * T.MIN, createdAt: n - 45 * T.DAY },
    { id: 'c9', name: 'Ahmed Khalil', channel: 'whatsapp', accountId: 'a3', handle: '+971 52 449 3310', country: '阿联酋', flag: '🇦🇪', language: '英语', source: '展会二维码', tags: ['询价-批发'], stage: 'contacted', ownerId: 'm4', dealValue: 9000, intent: 58, fields: { company: 'Gulf Outdoor LLC' }, summary: '迪拜户外店，想要 OEM 贴牌，询问最小起订量。', lastActiveAt: n - 5 * T.HOUR, createdAt: n - 3 * T.DAY },
    { id: 'c10', name: 'Juan Pablo Ortiz', channel: 'whatsapp', accountId: 'a1', handle: '+52 81 2245 9031', country: '墨西哥', flag: '🇲🇽', language: '西班牙语', source: '老客户转介绍', tags: ['老客户', '高意向'], stage: 'won', ownerId: 'm3', dealValue: 31200, intent: 90, fields: { company: 'Solar Norte', product: 'SV-2000', budget: '$30k+' }, summary: '蒙特雷老客户，第三次返单 100 台，已付 30% 定金。', lastActiveAt: n - 1 * T.DAY, createdAt: n - 160 * T.DAY },
    { id: 'c11', name: '山田 美咲', channel: 'line', accountId: 'a5', handle: 'misaki_y', country: '日本', flag: '🇯🇵', language: '日语', source: 'LINE 官方号', tags: ['询价-零售'], stage: 'contacted', ownerId: 'm2', dealValue: 450, intent: 61, fields: { product: 'SV-600' }, summary: '想买防灾用电源，在比较 SV-600 和 SV-1000 的容量。', lastActiveAt: n - 6 * T.HOUR, createdAt: n - 2 * T.DAY },
    { id: 'c12', name: 'Budi Santoso', channel: 'whatsapp', accountId: 'a4', handle: '+62 813 5520 1187', country: '印尼', flag: '🇮🇩', language: '印尼语', source: '分流链接-东南亚', tags: ['沉睡客户', '询价-批发'], stage: 'quoted', ownerId: 'm4', dealValue: 12000, intent: 35, fields: { company: 'PT Surya Mandiri' }, summary: '报价后 18 天未回复，所在账号已被封，需要换号重新触达。', lastActiveAt: n - 18 * T.DAY, createdAt: n - 40 * T.DAY },
    { id: 'c13', name: 'Olivia Bennett', channel: 'messenger', accountId: 'a8', handle: 'olivia.bennett', country: '美国', flag: '🇺🇸', language: '英语', source: 'FB 主页', tags: ['询价-零售'], stage: 'new', ownerId: 'm5', dealValue: 0, intent: 44, fields: {}, summary: '询问 SV-1000 是否能带动 CPAP 呼吸机。', lastActiveAt: n - 8 * T.HOUR, createdAt: n - 8 * T.HOUR },
    { id: 'c14', name: 'Nguyễn Văn An', channel: 'telegram', accountId: 'a7', handle: '@an_nguyen', country: '越南', flag: '🇻🇳', language: '越南语', source: '分流链接-东南亚', tags: ['代理商'], stage: 'lost', ownerId: 'm3', dealValue: 8000, intent: 12, fields: { company: 'An Phat Energy' }, summary: '选择了本地竞品，价格差 11%。', lastActiveAt: n - 22 * T.DAY, createdAt: n - 50 * T.DAY },
    { id: 'c15', name: 'Valentina Rossi', channel: 'whatsapp', accountId: 'a2', handle: '+39 333 410 2297', country: '意大利', flag: '🇮🇹', language: '意大利语', source: '官网 B2B 页', tags: ['要样品'], stage: 'qualified', ownerId: 'm3', dealValue: 7400, intent: 66, fields: { company: 'Rossi Outdoor' }, summary: '米兰户外店，要 2 台样品测试，愿意承担运费。', lastActiveAt: n - 30 * T.HOUR, createdAt: n - 9 * T.DAY },
    { id: 'c16', name: 'Chinedu Okafor', channel: 'whatsapp', accountId: 'a3', handle: '+234 803 551 2019', country: '尼日利亚', flag: '🇳🇬', language: '英语', source: 'FB 广告-非洲', tags: ['询价-批发', '价格敏感'], stage: 'contacted', ownerId: 'm4', dealValue: 5600, intent: 47, fields: { product: 'SV-600 + 100W 板' }, summary: '拉各斯批发商，停电频繁，需求量大但预算紧，想要账期。', lastActiveAt: n - 50 * T.MIN, createdAt: n - 2 * T.DAY },
    { id: 'c17', name: 'Priya Sharma', channel: 'telegram', accountId: 'a7', handle: '@priya_s', country: '印度', flag: '🇮🇳', language: '英语', source: '官网 B2B 页', tags: ['物流咨询'], stage: 'new', ownerId: 'm3', dealValue: 0, intent: 28, fields: {}, summary: '询问 BIS 认证情况。', lastActiveAt: n - 12 * T.HOUR, createdAt: n - 12 * T.HOUR },
    { id: 'c18', name: 'Kanya Srisuk', channel: 'line', accountId: 'a6', handle: 'kanya.s', country: '泰国', flag: '🇹🇭', language: '泰语', source: '泰国代理群', tags: ['高意向'], stage: 'quoted', ownerId: 'm2', dealValue: 6800, intent: 72, fields: { company: 'Kanya Shop' }, summary: '清迈零售店，已发报价，正在等老板确认。', lastActiveAt: n - 7 * T.HOUR, createdAt: n - 8 * T.DAY },
  ]
  const contacts: Contact[] = raw.map((c, i) => ({ ...c, color: c.color ?? palette[i % palette.length] }))

  const conversations: Conversation[] = [
    { id: 'v1', contactId: 'c1', accountId: 'a1', mode: 'ai', unread: 2, lastMessageAt: n - 2 * T.MIN },
    { id: 'v7', contactId: 'c7', accountId: 'a1', mode: 'ai', unread: 1, lastMessageAt: n - 4 * T.MIN },
    { id: 'v2', contactId: 'c2', accountId: 'a2', mode: 'ai', unread: 0, lastMessageAt: n - 9 * T.MIN },
    { id: 'v8', contactId: 'c8', accountId: 'a2', mode: 'pending', unread: 3, lastMessageAt: n - 15 * T.MIN, handoffReason: '客户投诉 · 情绪激动，要求退款' },
    { id: 'v3', contactId: 'c3', accountId: 'a3', mode: 'pending', unread: 1, lastMessageAt: n - 26 * T.MIN, handoffReason: '进入报价环节 · 金额 $42,000 超过 AI 处理上限' },
    { id: 'v4', contactId: 'c4', accountId: 'a5', mode: 'manual', unread: 0, lastMessageAt: n - 41 * T.MIN, assigneeId: 'm5' },
    { id: 'v16', contactId: 'c16', accountId: 'a3', mode: 'ai', unread: 0, lastMessageAt: n - 50 * T.MIN },
    { id: 'v5', contactId: 'c5', accountId: 'a6', mode: 'manual', unread: 0, lastMessageAt: n - 2 * T.HOUR, assigneeId: 'm2', starred: true },
    { id: 'v6', contactId: 'c6', accountId: 'a7', mode: 'ai', unread: 0, lastMessageAt: n - 3 * T.HOUR },
    { id: 'v9', contactId: 'c9', accountId: 'a3', mode: 'ai', unread: 0, lastMessageAt: n - 5 * T.HOUR },
    { id: 'v11', contactId: 'c11', accountId: 'a5', mode: 'ai', unread: 0, lastMessageAt: n - 6 * T.HOUR },
    { id: 'v13', contactId: 'c13', accountId: 'a8', mode: 'closed', unread: 0, lastMessageAt: n - 8 * T.HOUR },
  ]

  let mi = 0
  const m = (conversationId: string, from: Message['from'], text: string, ago: number, translated?: string, extra: Partial<Message> = {}): Message => ({
    id: `msg${++mi}`,
    conversationId,
    from,
    text,
    translated,
    time: n - ago,
    ...extra,
  })

  const messages: Message[] = [
    m('v1', 'customer', 'Hola, vi su anuncio en Facebook. ¿Venden la estación SV-2000 al por mayor?', 32 * T.MIN, '你好，我在 Facebook 上看到你们的广告。SV-2000 储能电源可以批发吗？'),
    m('v1', 'ai', '¡Hola Carlos! Sí, la SV-2000 está disponible al por mayor. ¿Aproximadamente cuántas unidades necesita y a qué país sería el envío?', 31 * T.MIN, '你好 Carlos！SV-2000 可以批发。请问您大概需要多少台，发往哪个国家？', { agentName: 'Sofía', actionIds: ['ac1'] }),
    m('v1', 'customer', 'Somos distribuidores en Guadalajara. Para empezar unas 60 unidades, entrega en Manzanillo.', 28 * T.MIN, '我们是瓜达拉哈拉的经销商。首单大约 60 台，送到曼萨尼约港。'),
    m('v1', 'ai', 'Perfecto. Para 60 unidades aplica nuestro segundo nivel de precio. ¿Tiene una fecha objetivo de llegada? Así le preparo la cotización CIF Manzanillo.', 27 * T.MIN, '好的，60 台适用第二档价格。您有期望的到货时间吗？我好帮您准备 CIF 曼萨尼约报价。', { agentName: 'Sofía', actionIds: ['ac2', 'ac3'] }),
    m('v1', 'customer', 'Antes de marzo idealmente. ¿Cuál sería el precio por unidad?', 3 * T.MIN, '最好 3 月前到。单价大概多少？'),
    m('v1', 'customer', '¿Y tienen certificación NOM?', 2 * T.MIN, '另外你们有 NOM 认证吗？'),

    m('v7', 'customer', 'Buenas, ¿hacen envíos a Bogotá?', 4 * T.MIN, '你好，能发到波哥大吗？'),

    m('v2', 'customer', 'Oi! Quanto custa a SV-600? Na Amazon está R$ 2.899', 40 * T.MIN, '你好！SV-600 多少钱？亚马逊上卖 2899 雷亚尔'),
    m('v2', 'ai', 'Olá Ana! Comprando direto conosco a SV-600 sai por US$ 389 com frete incluso. Para o Brasil os impostos de importação são calculados na entrega. Quer que eu envie o link de compra?', 38 * T.MIN, '你好 Ana！直接从我们这里买 SV-600 是 389 美元含运费。巴西的进口税在派送时计算。需要我发购买链接吗？', { agentName: 'Sofía', actionIds: ['ac4'] }),
    m('v2', 'customer', 'Hmm, vou pensar. Tem algum cupom?', 9 * T.MIN, '嗯，我考虑一下。有优惠券吗？'),

    m('v8', 'customer', 'Meu pedido está atrasado há 12 dias!!! Ninguém me responde', 40 * T.MIN, '我的订单已经延误 12 天了！！！没人回复我'),
    m('v8', 'ai', 'Sinto muito pelo atraso, Maria. Pode me passar o número do pedido para eu verificar?', 39 * T.MIN, '非常抱歉延误了，Maria。能把订单号发给我查一下吗？', { agentName: 'Sofía' }),
    m('v8', 'customer', 'SV20260911-0832. Quero meu dinheiro de volta', 20 * T.MIN, 'SV20260911-0832。我要退款'),
    m('v8', 'system', 'AI 检测到投诉与退款诉求，已暂停自动回复并转人工', 19 * T.MIN, undefined, { actionIds: ['ac5'] }),
    m('v8', 'customer', 'Alô???', 15 * T.MIN, '有人吗？？？'),

    m('v3', 'customer', 'We confirm SASO is required. Please send final price for 120 sets SV-3600 with 400W panels.', 30 * T.MIN, '确认需要 SASO 认证。请发 120 套 SV-3600 配 400W 太阳能板的最终价格。'),
    m('v3', 'system', '订单金额约 $42,000，超过 AI 报价上限 $10,000，已转人工', 26 * T.MIN, undefined, { actionIds: ['ac6'] }),

    m('v4', 'customer', '充電ポートが少し緩くなってしまいました。保証は使えますか？', 3 * T.HOUR, '充电口有点松了。可以用保修吗？'),
    m('v4', 'ai', 'ご連絡ありがとうございます。保証期間内ですので無償修理が可能です。ご注文番号をお知らせいただけますか？', 3 * T.HOUR - 2 * T.MIN, '感谢联系。在保修期内可以免费维修。能告诉我订单号吗？', { agentName: 'さくら' }),
    m('v4', 'customer', 'JP-2025-11873 です。', 50 * T.MIN, '订单号是 JP-2025-11873。'),
    m('v4', 'agent', '佐藤様、確認できました。返送用の着払い伝票をお送りします。', 41 * T.MIN, '佐藤先生，已确认。我们会寄给您到付的回寄运单。', { agentName: '何素' }),

    m('v16', 'customer', 'Do you offer credit terms? We buy every month.', 55 * T.MIN, '你们可以给账期吗？我们每月都采购。'),
    m('v16', 'ai', 'Thanks Chinedu! For first orders we work with 30% deposit and 70% before shipment. After 3 orders we can review credit terms. How many units per month do you plan?', 50 * T.MIN, '谢谢 Chinedu！首单是 30% 定金 + 70% 发货前付清，3 单之后可以评估账期。您计划每月采购多少台？', { agentName: 'Adam' }),

    m('v5', 'customer', 'ถ้าได้สิทธิ์ตัวแทนจำหน่ายแต่เพียงผู้เดียว เราสั่ง 80 เครื่องได้เลย', 3 * T.HOUR, '如果给独家代理权，我们可以直接下 80 台。'),
    m('v5', 'agent', '独家代理需要年度承诺量，我们可以先签 6 个月区域保护，返点 3%，您看可以吗？', 2 * T.HOUR, 'การเป็นตัวแทนแต่เพียงผู้เดียวต้องมียอดสั่งซื้อรายปี เราสามารถให้การคุ้มครองพื้นที่ 6 เดือนและคืนเงิน 3% ได้ไหมคะ', { agentName: '林晚秋' }),

    m('v6', 'customer', 'Can you share CE and WEEE documents? We want a 20-unit trial order.', 3 * T.HOUR + 5 * T.MIN, '能提供 CE 和 WEEE 文件吗？我们想先下 20 台试单。'),
    m('v6', 'ai', 'Of course Lukas. I have attached our CE certificate and WEEE registration. For a 20-unit trial, lead time is 15 days. Shall I prepare a DDP Hamburg quote?', 3 * T.HOUR, '当然可以 Lukas。已附上 CE 证书和 WEEE 注册号。20 台试单交期 15 天。需要我准备 DDP 汉堡的报价吗？', { agentName: 'Adam' }),

    m('v9', 'customer', 'What is your MOQ for OEM with our logo?', 5 * T.HOUR + 3 * T.MIN, '印我们 logo 的 OEM 起订量是多少？'),
    m('v9', 'ai', 'Hi Ahmed, OEM MOQ is 200 units for logo printing and 500 units for custom packaging. Could you tell me your company name and expected annual volume?', 5 * T.HOUR, '你好 Ahmed，印 logo 的 OEM 起订量是 200 台，定制包装 500 台。能告诉我公司名和预计年采购量吗？', { agentName: 'Adam' }),

    m('v11', 'customer', 'SV-600とSV-1000、防災用ならどちらがおすすめですか？', 6 * T.HOUR + 2 * T.MIN, '防灾用的话，SV-600 和 SV-1000 推荐哪个？'),
    m('v11', 'ai', '防災用途でしたらSV-1000をおすすめします。冷蔵庫を約8時間動かせる容量です。', 6 * T.HOUR, '防灾用途推荐 SV-1000，可以带动冰箱约 8 小时。', { agentName: 'さくら' }),

    m('v13', 'customer', 'Can SV-1000 run a CPAP machine overnight?', 8 * T.HOUR + 4 * T.MIN, 'SV-1000 能带 CPAP 呼吸机整晚吗？'),
    m('v13', 'ai', 'Yes! A typical CPAP draws 30-60W, so SV-1000 can run it for about 2-3 nights.', 8 * T.HOUR, '可以！普通 CPAP 功率 30-60W，SV-1000 可以用 2-3 晚。', { agentName: 'Sofía' }),
  ]

  const aiActions: AiAction[] = [
    { id: 'ac1', type: 'add_tag', label: '添加标签', detail: '询价-批发', contactId: 'c1', conversationId: 'v1', agentId: 'ag1', time: n - 31 * T.MIN, status: 'applied', payload: { tag: '询价-批发' } },
    { id: 'ac2', type: 'update_stage', label: '推进阶段', detail: '已接触 → 需求确认', contactId: 'c1', conversationId: 'v1', agentId: 'ag1', time: n - 27 * T.MIN, status: 'applied', payload: { from: 'contacted', to: 'qualified' } },
    { id: 'ac3', type: 'update_field', label: '填写字段', detail: '采购产品 = SV-2000 储能电源', contactId: 'c1', conversationId: 'v1', agentId: 'ag1', time: n - 27 * T.MIN, status: 'applied', payload: { field: 'product', value: 'SV-2000 储能电源' } },
    { id: 'ac4', type: 'add_tag', label: '添加标签', detail: '价格敏感', contactId: 'c2', conversationId: 'v2', agentId: 'ag1', time: n - 38 * T.MIN, status: 'applied', payload: { tag: '价格敏感' } },
    { id: 'ac5', type: 'handoff', label: '转人工', detail: '投诉 · 退款诉求', contactId: 'c8', conversationId: 'v8', agentId: 'ag1', time: n - 19 * T.MIN, status: 'applied', payload: {} },
    { id: 'ac6', type: 'handoff', label: '转人工', detail: '报价金额超过上限', contactId: 'c3', conversationId: 'v3', agentId: 'ag2', time: n - 26 * T.MIN, status: 'applied', payload: {} },
    { id: 'ac7', type: 'create_task', label: '创建任务', detail: '明天跟进 Lukas 的 DDP 报价', contactId: 'c6', conversationId: 'v6', agentId: 'ag2', time: n - 3 * T.HOUR, status: 'pending_review', payload: { title: '跟进 Lukas 的 DDP 汉堡报价' } },
    { id: 'ac8', type: 'update_field', label: '填写字段', detail: '公司 = Gulf Outdoor LLC', contactId: 'c9', conversationId: 'v9', agentId: 'ag2', time: n - 5 * T.HOUR, status: 'pending_review', payload: { field: 'company', value: 'Gulf Outdoor LLC' } },
    { id: 'ac9', type: 'add_tag', label: '添加标签', detail: '询价-零售', contactId: 'c11', conversationId: 'v11', agentId: 'ag3', time: n - 6 * T.HOUR, status: 'applied', payload: { tag: '询价-零售' } },
    { id: 'ac10', type: 'add_tag', label: '添加标签', detail: '价格敏感', contactId: 'c16', conversationId: 'v16', agentId: 'ag2', time: n - 50 * T.MIN, status: 'reverted', payload: { tag: '价格敏感' } },
  ]

  const tasks: Task[] = [
    { id: 't1', contactId: 'c1', title: '发送 60 台 SV-2000 的 CIF 曼萨尼约报价单', due: n + 2 * T.HOUR, done: false, ownerId: 'm3', createdBy: 'ai' },
    { id: 't2', contactId: 'c3', title: '确认 SASO 认证费用并更新报价 V3', due: n - 3 * T.HOUR, done: false, ownerId: 'm4', createdBy: 'user' },
    { id: 't3', contactId: 'c5', title: '准备 6 个月区域保护协议草稿', due: n + 1 * T.DAY, done: false, ownerId: 'm2', createdBy: 'user' },
    { id: 't4', contactId: 'c12', title: '用新账号重新触达 Budi（原号被封）', due: n - 1 * T.DAY, done: false, ownerId: 'm4', createdBy: 'sop' },
    { id: 't5', contactId: 'c6', title: '跟进 Lukas 的 DDP 汉堡报价', due: n + 20 * T.HOUR, done: false, ownerId: 'm3', createdBy: 'ai' },
    { id: 't6', contactId: 'c15', title: '寄出 2 台样品并发快递单号', due: n + 4 * T.HOUR, done: false, ownerId: 'm3', createdBy: 'ai' },
    { id: 't7', contactId: 'c8', title: '核实订单 SV20260911-0832 物流并回复客户', due: n + 30 * T.MIN, done: false, ownerId: 'm5', createdBy: 'ai' },
    { id: 't8', contactId: 'c10', title: '催收 70% 尾款', due: n + 3 * T.DAY, done: false, ownerId: 'm3', createdBy: 'user' },
    { id: 't9', contactId: 'c18', title: '询问 Kanya 老板对报价的意见', due: n - 5 * T.HOUR, done: false, ownerId: 'm2', createdBy: 'sop' },
    { id: 't10', contactId: 'c4', title: '寄出到付回寄运单', due: n - 2 * T.HOUR, done: true, ownerId: 'm5', createdBy: 'user' },
    { id: 't11', contactId: 'c9', title: '发送 OEM 方案与目录', due: n - 1 * T.DAY, done: true, ownerId: 'm4', createdBy: 'ai' },
  ]

  const campaigns: Campaign[] = [
    { id: 'cp1', name: '黑五预热 · 拉美批发老客户', channel: 'whatsapp', audienceDesc: '标签含「老客户」· 国家 墨西哥/巴西/哥伦比亚', audience: 1240, status: 'running', sent: 731, delivered: 702, replied: 118, variants: 4, ratePerMin: 8, scheduledAt: n - 2 * T.HOUR, createdAt: n - 1 * T.DAY },
    { id: 'cp2', name: '沉睡客户唤醒 · 报价未回复', channel: 'whatsapp', audienceDesc: '阶段 = 已报价 · 14 天无互动', audience: 312, status: 'scheduled', sent: 0, delivered: 0, replied: 0, variants: 3, ratePerMin: 5, scheduledAt: n + 16 * T.HOUR, createdAt: n - 3 * T.HOUR },
    { id: 'cp3', name: '日本防灾月 · SV-1000 优惠', channel: 'line', audienceDesc: 'LINE 日本官方号全部好友', audience: 3120, status: 'done', sent: 3120, delivered: 3096, replied: 284, variants: 2, ratePerMin: 30, scheduledAt: n - 9 * T.DAY, createdAt: n - 10 * T.DAY },
    { id: 'cp4', name: '中东斋月经销商招募', channel: 'whatsapp', audienceDesc: '国家 沙特/阿联酋 · 标签 代理商', audience: 186, status: 'paused', sent: 64, delivered: 61, replied: 9, variants: 3, ratePerMin: 4, scheduledAt: n - 2 * T.DAY, createdAt: n - 3 * T.DAY },
    { id: 'cp5', name: '欧洲 Q1 新品目录', channel: 'telegram', audienceDesc: '账号 欧洲 B2B 全部联系人', audience: 642, status: 'draft', sent: 0, delivered: 0, replied: 0, variants: 0, ratePerMin: 10, scheduledAt: n + 3 * T.DAY, createdAt: n - 20 * T.MIN },
  ]

  const sops: SopFlow[] = [
    {
      id: 's1', name: '新好友 7 天培育', trigger: '新添加好友且 AI 判定为询价', enabled: true, enrolled: 482, replyRate: 37.6,
      steps: [
        { id: 'st1', day: 0, hour: 0, content: '欢迎语 + 询问采购用途与数量', aiPersonalize: true },
        { id: 'st2', day: 1, hour: 10, content: '发送对应型号的产品视频与参数卡', aiPersonalize: true },
        { id: 'st3', day: 3, hour: 10, content: '分享同国家客户案例（带实拍图）', aiPersonalize: true },
        { id: 'st4', day: 7, hour: 15, content: '限时阶梯价提醒，引导索取报价', aiPersonalize: false },
      ],
    },
    {
      id: 's2', name: '报价后跟进', trigger: '阶段变为「已报价」', enabled: true, enrolled: 96, replyRate: 52.1,
      steps: [
        { id: 'st5', day: 1, hour: 11, content: '确认对方是否收到报价、有无疑问', aiPersonalize: true },
        { id: 'st6', day: 4, hour: 11, content: '针对对方关注点（价格/交期/认证）补充说明', aiPersonalize: true },
        { id: 'st7', day: 10, hour: 16, content: '提醒价格有效期，并生成人工跟进任务', aiPersonalize: false },
      ],
    },
    {
      id: 's3', name: '成交后复购', trigger: '阶段变为「已成交」', enabled: false, enrolled: 41, replyRate: 28.4,
      steps: [
        { id: 'st8', day: 3, hour: 10, content: '确认到货与使用情况，邀请好评', aiPersonalize: true },
        { id: 'st9', day: 45, hour: 10, content: '推荐配件（太阳能板/延长线）', aiPersonalize: true },
        { id: 'st10', day: 90, hour: 10, content: '返单优惠提醒', aiPersonalize: false },
      ],
    },
  ]

  const links: TrafficLink[] = [
    { id: 'l1', name: 'FB 广告-墨西哥批发', slug: 'mx-wholesale', channel: 'whatsapp', accountIds: ['a1', 'a2'], strategy: 'least_load', clicks: 4821, newContacts: 1137, enabled: true, createdAt: n - 40 * T.DAY },
    { id: 'l2', name: 'TikTok 引流链接', slug: 'tt-br', channel: 'whatsapp', accountIds: ['a2'], strategy: 'round_robin', clicks: 9302, newContacts: 1584, enabled: true, createdAt: n - 25 * T.DAY },
    { id: 'l3', name: '分流链接-东南亚', slug: 'sea', channel: 'whatsapp', accountIds: ['a4'], strategy: 'weighted', clicks: 2210, newContacts: 402, enabled: false, createdAt: n - 70 * T.DAY },
    { id: 'l4', name: '展会二维码', slug: 'expo-dubai', channel: 'whatsapp', accountIds: ['a3'], strategy: 'round_robin', clicks: 388, newContacts: 211, enabled: true, createdAt: n - 14 * T.DAY },
  ]

  const day0 = new Date(n).setHours(0, 0, 0, 0)
  const AI_DAILY = [96, 104, 88, 72, 118, 126, 131, 109, 98, 142, 151, 137, 128, 64]
  const TR_DAILY = [21, 24, 19, 12, 26, 28, 30, 25, 22, 31, 33, 29, 27, 14]
  const usageDaily: UsageDay[] = AI_DAILY.map((ai, i) => ({
    date: day0 - (AI_DAILY.length - 1 - i) * T.DAY,
    ai: ai * 1_000,
    translate: TR_DAILY[i] * 1_000,
  }))
  const cycleUsed = usageDaily.reduce((a, d) => a + d.ai + d.translate, 0)

  const billing: Billing = {
    plan: 'pro',
    seats: 10,
    expiresAt: day0 + 37 * T.DAY,
    points: 1_151_800,
    cycleUsed,
    agentUsage: {
      ag1: { replies: 1_092, points: 1_092_000 },
      ag2: { replies: 418, points: 418_000 },
      ag3: { replies: 54, points: 54_000 },
      ag4: { replies: 236, points: 236_000 },
    },
    accountUsage: {
      a1: { replies: 642, points: 642_000 },
      a2: { replies: 398, points: 398_000 },
      a3: { replies: 271, points: 271_000 },
      a5: { replies: 38, points: 38_000 },
      a6: { replies: 16, points: 16_000 },
      a7: { replies: 236, points: 236_000 },
      a8: { replies: 52, points: 52_000 },
    },
  }

  const orders: Order[] = [
    { id: 'PO20260917001', kind: 'renew', months: 3, amountUsd: 273.6, method: 'alipay', status: 'done', createdAt: n - 54 * T.DAY, doneAt: n - 54 * T.DAY + 2 * T.HOUR },
    { id: 'PO20261003004', kind: 'seats', seats: 2, amountUsd: 18.4, method: 'wechat', status: 'done', createdAt: n - 21 * T.DAY, doneAt: n - 21 * T.DAY + 40 * T.MIN },
    { id: 'PO20261015002', kind: 'points', points: 7_920_000, amountUsd: 100, method: 'usdt', status: 'done', createdAt: n - 9 * T.DAY, doneAt: n - 9 * T.DAY + 25 * T.MIN },
    { id: 'PO20261021007', kind: 'points', points: 720_000, amountUsd: 10, method: 'wechat', status: 'rejected', createdAt: n - 3 * T.DAY, doneAt: n - 3 * T.DAY + 3 * T.HOUR },
  ]

  const usage: UsageRecord[] = [
    { id: 'u1', time: n - 13 * T.MIN, kind: 'ai_reply', points: 1_000, contactId: 'c1', agentId: 'ag1' },
    { id: 'u2', time: n - 22 * T.MIN, kind: 'ai_reply', points: 1_000, contactId: 'c2', agentId: 'ag1' },
    { id: 'u3', time: n - 31 * T.MIN, kind: 'translate', points: 100, contactId: 'c4', memberId: 'm3' },
    { id: 'u4', time: n - 38 * T.MIN, kind: 'ai_reply', points: 1_000, contactId: 'c5', agentId: 'ag2' },
    { id: 'u5', time: n - 52 * T.MIN, kind: 'ai_reply', points: 1_000, contactId: 'c7', agentId: 'ag1' },
    { id: 'u6', time: n - 64 * T.MIN, kind: 'translate', points: 100, contactId: 'c6', memberId: 'm2' },
    { id: 'u7', time: n - 80 * T.MIN, kind: 'ai_reply', points: 1_000, contactId: 'c8', agentId: 'ag2' },
    { id: 'u8', time: n - 2 * T.HOUR, kind: 'ai_reply', points: 1_000, contactId: 'c3', agentId: 'ag1' },
  ]

  return { accounts, agents, templates, knowledge, contacts, conversations, messages, aiActions, tasks, campaigns, sops, links, billing, orders, usage, usageDaily }
}

export type SeedData = ReturnType<typeof createSeed>
