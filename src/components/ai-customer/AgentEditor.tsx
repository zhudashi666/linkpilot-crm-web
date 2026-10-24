import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { ChevronDown, Database, GitBranch, PencilLine, Sparkles, Trash2, UserRoundCheck } from 'lucide-react'
import { Modal, Toggle } from '../ui'
import { PlatformIcon } from '../PlatformIcon'
import {
  PERSONA_FIELDS,
  REGION_CITIES,
  charCount,
  groupLabelFor,
  missingDraftFields,
  openPromptLimit,
  regionOption,
  type AgentDraft,
} from '../../lib/ai-customer'
import { STAGES } from '../../lib/meta'
import type { AiTemplate, PersonaFields } from '../../types'

/** 创建 / 编辑 AI 客服模板：字段与文案对齐 AI 客服前端，底部追加 CRM 联动（转人工 + 写回权限）。 */
export function AgentEditor({
  draft,
  sourceTemplate,
  inheritedKnowledgeCount,
  boundAccounts,
  onChange,
  onClose,
  onSave,
}: {
  draft: AgentDraft
  sourceTemplate?: AiTemplate
  inheritedKnowledgeCount: number
  boundAccounts: number
  onChange: (d: AgentDraft) => void
  onClose: () => void
  onSave: () => void
}) {
  const fromTemplate = Boolean(draft.templateId)
  const missing = missingDraftFields(draft)

  return (
    <Modal
      open
      title={draft.isNew ? '创建 AI 客服模板' : `编辑 ${draft.name || 'AI 客服'}`}
      onClose={onClose}
      width={896}
      bodyClassName="p-5"
      footer={
        <>
          {missing.length > 0 && <span className="mr-auto text-xs text-muted">请填写：{missing.join('、')}</span>}
          <button type="button" className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" disabled={missing.length > 0} onClick={onSave}>
            {draft.isNew ? '创建 AI 客服' : '保存修改'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <ScopeHeader draft={draft} sourceTemplate={sourceTemplate} inheritedKnowledgeCount={inheritedKnowledgeCount} />

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-medium text-text">
              AI 客服名称 <span className="text-danger">*</span>
            </span>
            <input className="input h-11" value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} placeholder={`例如：${draft.platform} 售后专员`} />
            <span className="mt-2 block text-xs leading-5 text-muted">用于识别这套 AI 客服配置；具体服务账号稍后在「账号矩阵」中绑定。</span>
          </label>
          <label className="mt-4 block min-w-0">
            <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-text">
              <span>
                用途介绍 <span className="text-danger">*</span>
              </span>
              <span className="tnum text-xs font-normal text-muted">{charCount(draft.role)} / 20</span>
            </span>
            <input className="input h-11" maxLength={20} value={draft.role} onChange={(e) => onChange({ ...draft, role: e.target.value })} placeholder="例如：售后退换货与物流查询" />
            <span className="mt-2 block text-xs leading-5 text-muted">简要说明这套 AI 客服用于什么场景，最多 20 个字。</span>
          </label>
        </div>

        <div className="space-y-4">
          {draft.personaFields ? (
            <PersonaFieldsSection
              value={draft.personaFields}
              regionCode={draft.regionCode}
              boundaries={draft.businessPrompt}
              onBoundariesChange={(businessPrompt) => onChange({ ...draft, businessPrompt })}
              onChange={(personaFields) => onChange({ ...draft, personaFields })}
            />
          ) : (
            <>
              <OpenPromptSection
                title="开放区 · 人设"
                guidance="你是谁、住哪、做什么、什么性格"
                value={draft.rolePrompt}
                onChange={(rolePrompt) => onChange({ ...draft, rolePrompt })}
                maxLength={openPromptLimit(fromTemplate, 'role')}
              />
              <OpenPromptSection
                title="开放区 · 业务资料"
                guidance="你不希望 AI 回复什么、有什么禁忌"
                value={draft.businessPrompt}
                onChange={(businessPrompt) => onChange({ ...draft, businessPrompt })}
                maxLength={openPromptLimit(fromTemplate, 'business')}
              />
            </>
          )}
        </div>

        <CrmLinkSection draft={draft} boundAccounts={boundAccounts} onChange={onChange} />
      </div>
    </Modal>
  )
}

function ScopeHeader({ draft, sourceTemplate, inheritedKnowledgeCount }: { draft: AgentDraft; sourceTemplate?: AiTemplate; inheritedKnowledgeCount: number }) {
  const region = regionOption(draft.regionCode)
  const fromTemplate = Boolean(draft.templateId)
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card2/35 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <PlatformIcon platform={draft.platform} className="!h-7 !w-7" />
        </span>
        <div className="min-w-0">
          <div className="text-xs text-muted">{draft.isNew ? '当前创建范围' : '当前所属范围'}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
            <span>
              {region.country} · {region.language}
            </span>
            <span className="text-border">/</span>
            <span>
              {groupLabelFor(draft.platform)} · {draft.platform}
            </span>
          </div>
          {!fromTemplate && <div className="mt-2 text-xs font-medium leading-5 text-warn">该功能不推荐新手使用</div>}
        </div>
      </div>
      {fromTemplate ? (
        <div className="rounded-xl border border-line/35 bg-line/10 px-4 py-3.5 shadow-sm sm:w-[380px] sm:max-w-[48%]">
          <div className="flex items-center gap-2 text-xs font-semibold text-line-text">
            <Sparkles size={14} />
            <span>基于公共预设模板追加</span>
          </div>
          <div className="mt-2 text-base font-bold text-text">{sourceTemplate?.name || draft.templateId}</div>
          <div className="mt-1.5 line-clamp-2 text-xs font-medium leading-5 text-text/75">{sourceTemplate?.description || '填写角色资料和回复边界，保留公共模板的基础规则。'}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-card/70 px-2 py-1 text-xs font-medium text-line-text">
            <Database size={12} />
            继承 {inheritedKnowledgeCount} 份知识资料
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-3.5 py-3 sm:w-[360px] sm:max-w-[45%]">
          <div className="text-[11px] text-muted">内容来源</div>
          <div className="mt-1 text-sm font-semibold text-text">空白创建</div>
          <div className="mt-1.5 text-xs leading-5 text-muted">不套用预置内容，直接填写人设与业务边界。</div>
        </div>
      )}
    </section>
  )
}

function PersonaFieldsSection({
  value,
  regionCode,
  boundaries,
  onBoundariesChange,
  onChange,
}: {
  value: PersonaFields
  regionCode: string
  boundaries: string
  onBoundariesChange: (v: string) => void
  onChange: (v: PersonaFields) => void
}) {
  const cities = REGION_CITIES[regionCode] ?? []
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border bg-card2/35 px-4 py-3">
        <h3 className="text-sm font-semibold text-text">角色资料</h3>
        <p className="mt-1 text-xs leading-5 text-muted">填写这套 AI 的角色设定，保存后加入人设提示词。回复语言：{regionOption(regionCode).language}。</p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        {PERSONA_FIELDS.map((f) => (
          <div key={f.key} className={clsx('block min-w-0', (f.key === 'fullName' || f.key === 'occupation') && 'sm:col-span-2')}>
            <label htmlFor={`persona-${f.key}`} className="mb-2 flex justify-between gap-2 text-sm font-medium text-text">
              <span>
                {f.label} <span className="text-danger">*</span>
              </span>
              <span className="tnum text-xs font-normal text-muted">
                {charCount(value[f.key])} / {f.limit}
              </span>
            </label>
            <input
              id={`persona-${f.key}`}
              className="input h-11"
              value={value[f.key]}
              maxLength={f.limit}
              inputMode={f.key === 'age' ? 'numeric' : 'text'}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              placeholder={f.key === 'city' ? '输入城市，或选择下方常用城市…' : `填写${f.label}…`}
            />
            {f.key === 'city' && cities.length > 0 && (
              <span className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="常用城市">
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    aria-pressed={value.city === city}
                    className={clsx('rounded-md border px-2 py-1 text-xs', value.city === city ? 'border-line/40 bg-line/10 text-line-text' : 'border-border bg-card text-muted hover:bg-card2')}
                    onClick={() => onChange({ ...value, city })}
                  >
                    {city}
                  </button>
                ))}
              </span>
            )}
          </div>
        ))}
        <label className="block sm:col-span-2">
          <span className="mb-2 flex justify-between gap-2 text-sm font-medium text-text">
            <span>
              当前情况与补充说明 <span className="text-xs font-normal text-muted">选填</span>
            </span>
            <span className="tnum text-xs font-normal text-muted">{charCount(value.currentStatus)} / 800</span>
          </span>
          <textarea
            className="input min-h-32 resize-y text-sm leading-6"
            maxLength={800}
            value={value.currentStatus}
            placeholder="补充角色背景、当前情况或沟通习惯…"
            onChange={(e) => onChange({ ...value, currentStatus: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-2 flex justify-between gap-2 text-sm font-medium text-text">
            <span>
              不希望 AI 回复的事情 <span className="text-xs font-normal text-muted">选填</span>
            </span>
            <span className="tnum text-xs font-normal text-muted">{charCount(boundaries)} / 400</span>
          </span>
          <textarea
            className="input min-h-24 resize-y text-sm leading-6"
            maxLength={400}
            value={boundaries}
            placeholder="填写回复禁忌或需要避开的内容…"
            onChange={(e) => onBoundariesChange(e.target.value)}
          />
        </label>
      </div>
    </section>
  )
}

function OpenPromptSection({ title, guidance, value, onChange, maxLength }: { title: string; guidance: string; value: string; onChange: (v: string) => void; maxLength: number }) {
  const max = maxLength.toLocaleString('zh-CN')
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-border bg-card2/55 px-4 py-3">
        <PencilLine size={15} className="text-line-text" aria-hidden />
        <div className="min-w-[240px] flex-1">
          <div className="font-medium text-text">{title}</div>
          <div className="mt-0.5 text-xs leading-5 text-muted">{guidance}</div>
        </div>
        <span className="tnum ml-auto text-xs text-muted">
          {charCount(value).toLocaleString('zh-CN')} / {max}
        </span>
        {value && (
          <button type="button" className="btn-ghost ml-1 min-h-0 px-2 py-1 text-xs" onClick={() => onChange('')} aria-label={`清空${title}`}>
            <Trash2 size={12} aria-hidden />
            清空
          </button>
        )}
      </div>
      <div className="p-4">
        <textarea className="input min-h-60 resize-y text-sm leading-6" value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} aria-label={title} />
        <div className="mt-2 text-xs leading-5 text-muted">最多可填写 {max} 个字符，保存后应用于该 AI 客服。</div>
      </div>
    </section>
  )
}

/** CRM 版独有：AI 何时转人工、可以改写哪些客户数据。 */
function CrmLinkSection({ draft, boundAccounts, onChange }: { draft: AgentDraft; boundAccounts: number; onChange: (d: AgentDraft) => void }) {
  const [open, setOpen] = useState(!draft.isNew)
  const h = draft.handoff
  const w = draft.writeback
  const setH = (patch: Partial<AgentDraft['handoff']>) => onChange({ ...draft, handoff: { ...h, ...patch } })
  const setW = (patch: Partial<AgentDraft['writeback']>) => onChange({ ...draft, writeback: { ...w, ...patch } })
  const handoffOn = [h.lowConfidence, h.onQuote, h.onComplaint, h.onRequestHuman].filter(Boolean).length
  const writeOn = [w.tags, w.stage, w.fields, w.tasks].filter(Boolean).length

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 border-b border-border bg-card2/55 px-4 py-3 text-left">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-[#0284C7]">
          <GitBranch size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-medium text-text">
            CRM 联动 <span className="pill-muted">选填</span>
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-muted">
            转人工规则 {handoffOn} 条 · 写回权限 {writeOn} 项{w.reviewRequired ? ' · 写回需审核' : ''}
            {!draft.isNew && ` · 已绑定 ${boundAccounts} 个渠道账号`}
          </span>
        </span>
        <ChevronDown size={16} className={clsx('text-muted transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
              <UserRoundCheck size={15} className="text-warn" />
              转人工规则
            </div>
            <p className="mb-3 text-xs leading-5 text-muted">命中任一规则时，会话进入「待人工」并提醒负责人。</p>
            <div className="divide-y divide-divider">
              <RuleRow label="知识库未命中 / 置信度低" checked={h.lowConfidence} onChange={(v) => setH({ lowConfidence: v })}>
                <span className="text-xs text-muted">低于</span>
                <input
                  type="number"
                  step={0.05}
                  min={0.3}
                  max={0.95}
                  value={h.confidenceThreshold}
                  onChange={(e) => setH({ confidenceThreshold: Number(e.target.value) })}
                  className="input tnum h-8 w-20 px-2 text-xs"
                  disabled={!h.lowConfidence}
                />
              </RuleRow>
              <RuleRow label="大单报价" checked={h.onQuote} onChange={(v) => setH({ onQuote: v })}>
                <span className="text-xs text-muted">超过 $</span>
                <input type="number" step={500} value={h.dealOver} onChange={(e) => setH({ dealOver: Number(e.target.value) })} className="input tnum h-8 w-24 px-2 text-xs" disabled={!h.onQuote} />
              </RuleRow>
              <RuleRow label="客户投诉 / 退款" checked={h.onComplaint} onChange={(v) => setH({ onComplaint: v })} />
              <RuleRow label="客户要求人工" checked={h.onRequestHuman} onChange={(v) => setH({ onRequestHuman: v })} />
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text">
              <Database size={15} className="text-line-text" />
              CRM 写回权限
            </div>
            <p className="mb-3 text-xs leading-5 text-muted">AI 根据对话自动维护客户档案，所有动作可在「AI 动作日志」中撤销。</p>
            <div className="divide-y divide-divider">
              <RuleRow label="打标签" checked={w.tags} onChange={(v) => setW({ tags: v })} />
              <RuleRow label="推进销售阶段" checked={w.stage} onChange={(v) => setW({ stage: v })}>
                <span className="text-xs text-muted">最高到</span>
                <select value={w.maxStage} onChange={(e) => setW({ maxStage: e.target.value as AgentDraft['writeback']['maxStage'] })} className="select h-8 py-0 text-xs" disabled={!w.stage}>
                  {STAGES.filter((s) => s.key !== 'won' && s.key !== 'lost').map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </RuleRow>
              <RuleRow label="填写客户字段" checked={w.fields} onChange={(v) => setW({ fields: v })} />
              <RuleRow label="创建跟进任务" checked={w.tasks} onChange={(v) => setW({ tasks: v })} />
              <RuleRow label="写回前需人工审核" checked={w.reviewRequired} onChange={(v) => setW({ reviewRequired: v })} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function RuleRow({ label, checked, onChange, children }: { label: string; checked: boolean; onChange: (v: boolean) => void; children?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 py-1.5">
      <Toggle checked={checked} onChange={onChange} />
      <span className={clsx('flex-1 text-[13px]', checked ? 'text-text' : 'text-muted')}>{label}</span>
      {children && <span className="flex items-center gap-1.5">{children}</span>}
    </div>
  )
}
