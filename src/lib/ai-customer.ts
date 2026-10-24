import type { AiAgent, AiPlatform, AiTemplate, PersonaFields } from '../types'

export const PAGE_SIZE = 10
export const KNOWLEDGE_ASSOCIATION_LIMIT = 10

export const AI_REGION_OPTIONS = [
  { code: 'JP', country: '日本', language: '日语' },
  { code: 'AE', country: '阿联酋', language: '阿拉伯语' },
  { code: 'AU', country: '澳大利亚', language: '英语' },
  { code: 'BR', country: '巴西', language: '葡萄牙语' },
  { code: 'CA', country: '加拿大', language: '英语' },
  { code: 'DE', country: '德国', language: '德语' },
  { code: 'ES', country: '西班牙', language: '西班牙语' },
  { code: 'FR', country: '法国', language: '法语' },
  { code: 'GB', country: '英国', language: '英语' },
  { code: 'ID', country: '印尼', language: '印尼语' },
  { code: 'IN', country: '印度', language: '英语' },
  { code: 'IT', country: '意大利', language: '意大利语' },
  { code: 'KR', country: '韩国', language: '韩语' },
  { code: 'MX', country: '墨西哥', language: '西班牙语' },
  { code: 'MY', country: '马来西亚', language: '马来语' },
  { code: 'PH', country: '菲律宾', language: '英语' },
  { code: 'RU', country: '俄罗斯', language: '俄语' },
  { code: 'SG', country: '新加坡', language: '英语' },
  { code: 'TH', country: '泰国', language: '泰语' },
  { code: 'TR', country: '土耳其', language: '土耳其语' },
  { code: 'TW', country: '台湾', language: '繁体中文' },
  { code: 'US', country: '美国', language: '英语' },
  { code: 'VN', country: '越南', language: '越南语' },
] as const

export type AiRegionOption = (typeof AI_REGION_OPTIONS)[number]

export function regionOption(code: string | undefined): AiRegionOption {
  return AI_REGION_OPTIONS.find((o) => o.code === code) ?? AI_REGION_OPTIONS[0]
}

export const IM_AI_PLATFORMS: AiPlatform[] = ['LINE', 'WhatsApp', 'Telegram']
export const SOCIAL_AI_PLATFORMS: AiPlatform[] = ['Tinder', 'Bumble', 'Soul']
export const PICKER_PLATFORMS: AiPlatform[] = [...IM_AI_PLATFORMS, ...SOCIAL_AI_PLATFORMS]

export const CHANNEL_GROUPS = [
  { label: 'IM 平台', note: '客服工作台', platforms: IM_AI_PLATFORMS },
  { label: '社媒平台', note: '社媒工作台', platforms: SOCIAL_AI_PLATFORMS },
] as const

export function groupLabelFor(type: AiPlatform) {
  return CHANNEL_GROUPS.find((g) => g.platforms.includes(type))?.label ?? '渠道'
}

/** 基于公共模板追加时 2,000；空白创建时人设 20,000、业务资料 200,000。 */
export function openPromptLimit(fromTemplate: boolean, field: 'role' | 'business') {
  if (fromTemplate) return 2000
  return field === 'role' ? 20000 : 200000
}

/** 按 Unicode 码点计数，避免 CJK / emoji 被拆成 2 个字符。 */
export function charCount(value: string) {
  return Array.from(value).length
}

export function compactAccountName(value: string) {
  const chars = Array.from(value)
  return chars.length > 6 ? `${chars.slice(0, 6).join('')}…` : value
}

export function agentSummary(a: AiAgent) {
  return a.role || Array.from(a.personaFields ? compilePersonaFields(a.personaFields) : a.rolePrompt).slice(0, 20).join('')
}

export function templateMatches(t: AiTemplate, platform: AiPlatform, regionCode: string) {
  return t.platform === platform && t.regionCode === regionCode
}

// ---------- 结构化角色资料 ----------

export const PERSONA_FIELDS = [
  { key: 'publicName', label: '对外称呼', limit: 24 },
  { key: 'familiarName', label: '熟悉后的称呼', limit: 24 },
  { key: 'fullName', label: '全名', limit: 40 },
  { key: 'age', label: '年龄', limit: 3 },
  { key: 'city', label: '所在城市', limit: 40 },
  { key: 'occupation', label: '职业', limit: 40 },
] as const

const PERSONA_HEADER = '【AI 角色资料 · v1】'
const PERSONA_STATUS_HEADER = '【当前情况与补充说明】'

export function emptyPersonaFields(): PersonaFields {
  return { publicName: '', familiarName: '', fullName: '', age: '', city: '', occupation: '', currentStatus: '' }
}

export function personaFieldErrors(value: PersonaFields): string[] {
  const errors: string[] = PERSONA_FIELDS.filter((f) => !value[f.key].trim() || charCount(value[f.key]) > f.limit).map((f) => f.label)
  if (value.age.trim() && !/^\d{1,3}$/.test(value.age)) errors.push('年龄需填写数字')
  if (charCount(value.currentStatus) > 800) errors.push('补充说明最多 800 字')
  return errors
}

export function compilePersonaFields(value: PersonaFields): string {
  return [PERSONA_HEADER, ...PERSONA_FIELDS.map((f) => `${f.label}：${value[f.key]}`), PERSONA_STATUS_HEADER, value.currentStatus].join('\n')
}

/** 城市只是建议项，用户仍可自由输入。 */
export const REGION_CITIES: Record<string, readonly string[]> = {
  JP: ['东京', '大阪', '横滨', '福冈', '名古屋', '札幌'],
  AE: ['迪拜', '阿布扎比', '沙迦', '阿治曼'],
  AU: ['悉尼', '墨尔本', '布里斯班', '珀斯'],
  BR: ['圣保罗', '里约热内卢', '巴西利亚'],
  CA: ['多伦多', '温哥华', '蒙特利尔', '渥太华', '卡尔加里'],
  DE: ['柏林', '慕尼黑', '汉堡', '法兰克福'],
  ES: ['马德里', '巴塞罗那'],
  FR: ['巴黎', '里昂'],
  GB: ['伦敦', '曼彻斯特'],
  ID: ['雅加达', '泗水'],
  IN: ['新德里', '孟买'],
  IT: ['罗马', '米兰'],
  KR: ['首尔', '釜山'],
  MX: ['墨西哥城', '瓜达拉哈拉'],
  MY: ['吉隆坡', '槟城'],
  PH: ['马尼拉', '宿务'],
  RU: ['莫斯科', '圣彼得堡'],
  SG: ['新加坡'],
  TH: ['曼谷', '清迈'],
  TR: ['伊斯坦布尔', '安卡拉'],
  TW: ['台北', '高雄'],
  US: ['纽约', '洛杉矶', '芝加哥'],
  VN: ['河内', '胡志明市'],
}

// ---------- 编辑草稿 ----------

export type AgentDraft = Omit<AiAgent, 'stats' | 'creator' | 'updatedAt' | 'avatar'> & { isNew: boolean }

const DEFAULT_HANDOFF: AiAgent['handoff'] = {
  lowConfidence: true,
  confidenceThreshold: 0.6,
  onQuote: true,
  onComplaint: true,
  onRequestHuman: true,
  dealOver: 5000,
}

const DEFAULT_WRITEBACK: AiAgent['writeback'] = {
  tags: true,
  stage: true,
  maxStage: 'quoted',
  fields: true,
  tasks: true,
  reviewRequired: false,
}

export function blankDraft(platform: AiPlatform, regionCode: string): AgentDraft {
  return {
    isNew: true,
    id: '',
    name: '',
    role: '',
    platform,
    regionCode,
    templateId: '',
    rolePrompt: '',
    businessPrompt: '',
    status: 'active',
    handoff: { ...DEFAULT_HANDOFF },
    writeback: { ...DEFAULT_WRITEBACK },
  }
}

export function draftFromTemplate(t: AiTemplate): AgentDraft {
  return { ...blankDraft(t.platform, t.regionCode), templateId: t.id, personaFields: emptyPersonaFields() }
}

export function draftFromAgent(a: AiAgent): AgentDraft {
  const { stats, creator, updatedAt, avatar, ...rest } = a
  void stats
  void creator
  void updatedAt
  void avatar
  return { ...rest, isNew: false, personaFields: a.personaFields ? { ...a.personaFields } : undefined }
}

export function missingDraftFields(d: AgentDraft) {
  return [
    d.name.trim() ? '' : 'AI 客服名称',
    d.role.trim() ? '' : '用途介绍',
    ...(d.personaFields ? personaFieldErrors(d.personaFields) : [d.rolePrompt.trim() ? '' : '人设']),
    d.personaFields || d.businessPrompt.trim() ? '' : '业务资料',
    d.personaFields && charCount(d.businessPrompt) > 400 ? '回复禁忌最多 400 字' : '',
  ].filter(Boolean)
}

/** 公共模板在知识库关联里以伪客服身份出现 */
export const TEMPLATE_PREFIX = 'template:'
