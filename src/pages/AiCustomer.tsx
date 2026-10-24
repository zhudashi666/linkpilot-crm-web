import { useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Bot, Check, CheckCircle2, ChevronDown, Database, Globe2, Link2, PauseCircle, PencilLine, PlayCircle, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { Modal, Pagination, usePagination } from '../components/ui'
import { PlatformIcon } from '../components/PlatformIcon'
import { TemplatePicker } from '../components/ai-customer/TemplatePicker'
import { AgentEditor } from '../components/ai-customer/AgentEditor'
import {
  AI_REGION_OPTIONS,
  CHANNEL_GROUPS,
  PAGE_SIZE,
  agentSummary,
  blankDraft,
  compactAccountName,
  draftFromAgent,
  draftFromTemplate,
  groupLabelFor,
  regionOption,
  templateMatches,
  type AgentDraft,
  type AiRegionOption,
} from '../lib/ai-customer'
import { fmtTime } from '../lib/meta'
import type { AiAgent, AiPlatform, AiTemplate } from '../types'

export default function AiCustomer() {
  const agents = useStore((s) => s.agents)
  const templates = useStore((s) => s.templates)
  const knowledge = useStore((s) => s.knowledge)
  const accounts = useStore((s) => s.accounts)
  const saveAgent = useStore((s) => s.saveAgent)
  const removeAgent = useStore((s) => s.removeAgent)
  const toggleAgentStatus = useStore((s) => s.toggleAgentStatus)

  const [platform, setPlatform] = useState<AiPlatform>('WhatsApp')
  const [regionCode, setRegionCode] = useState('MX')
  const [draft, setDraft] = useState<AgentDraft | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AiAgent | null>(null)
  const [notice, setNotice] = useState('')

  const visibleAgents = useMemo(() => agents.filter((a) => a.platform === platform && a.regionCode === regionCode), [agents, platform, regionCode])
  const visibleTemplates = useMemo(() => templates.filter((t) => templateMatches(t, platform, regionCode)), [templates, platform, regionCode])
  const templateCountByType = useMemo(() => {
    const map = new Map<AiPlatform, number>()
    for (const t of templates) if (t.regionCode === regionCode) map.set(t.platform, (map.get(t.platform) ?? 0) + 1)
    return map
  }, [templates, regionCode])
  const regionCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const x of [...templates, ...agents]) map.set(x.regionCode, (map.get(x.regionCode) ?? 0) + 1)
    return map
  }, [templates, agents])
  const knowledgeByAgent = useMemo(() => {
    const map = new Map<string, number>()
    for (const k of knowledge) {
      for (const id of k.assistantIds) map.set(id, (map.get(id) ?? 0) + 1)
      for (const id of k.templateIds) map.set(id, (map.get(id) ?? 0) + 1)
    }
    return map
  }, [knowledge])
  const accountsByAgent = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of accounts) if (a.agentId) map.set(a.agentId, (map.get(a.agentId) ?? 0) + 1)
    return map
  }, [accounts])

  const { page, total, setPage, rows, count } = usePagination(visibleAgents, PAGE_SIZE)

  function selectPlatform(p: AiPlatform) {
    setPlatform(p)
    setPage(1)
    setNotice('')
  }
  function selectRegion(code: string) {
    setRegionCode(code)
    setPage(1)
    setNotice('')
  }
  function startBlank() {
    setPickerOpen(false)
    setNotice('')
    setDraft(blankDraft(platform, regionCode))
  }
  function startFromTemplate(t: AiTemplate) {
    setPickerOpen(false)
    setNotice('')
    setPlatform(t.platform)
    setRegionCode(t.regionCode)
    setDraft(draftFromTemplate(t))
  }
  function save() {
    if (!draft) return
    const name = draft.name.trim()
    saveAgent(draft)
    setPlatform(draft.platform)
    setRegionCode(draft.regionCode)
    setNotice(draft.isNew ? `已为「${draft.platform}」渠道创建 AI 客服「${name}」，当前状态为运行中。到「账号矩阵」为渠道账号绑定后即可开始接待。` : `已保存「${name}」。`)
    setDraft(null)
  }
  function confirmDelete() {
    if (!deleteTarget) return
    const affected = removeAgent(deleteTarget.id)
    setNotice(`已删除「${deleteTarget.name}」。${affected ? `已解除 ${affected} 个渠道账号的绑定，需重新绑定可用的 AI 客服。` : ''}`)
    setDeleteTarget(null)
  }

  const sourceTemplate = draft?.templateId ? templates.find((t) => t.id === draft.templateId) : undefined

  return (
    <div>
      <AiCustomerList
        regionCode={regionCode}
        regionCounts={regionCounts}
        platform={platform}
        templateCountByType={templateCountByType}
        templates={templates}
        publicTemplates={visibleTemplates}
        knowledgeByAgent={knowledgeByAgent}
        accountsByAgent={accountsByAgent}
        rows={rows}
        total={count}
        notice={notice}
        onClearNotice={() => setNotice('')}
        onRegionChange={selectRegion}
        onPlatformChange={selectPlatform}
        onStartFromTemplate={startFromTemplate}
        onEdit={(a) => {
          setNotice('')
          setDraft(draftFromAgent(a))
        }}
        onToggle={(a) => {
          toggleAgentStatus(a.id)
          setNotice(a.status === 'active' ? `已停用「${a.name}」，绑定的渠道账号将不再由 AI 自动接待。` : `已启用「${a.name}」。`)
        }}
        onDelete={setDeleteTarget}
        onCreate={() => {
          setNotice('')
          setPickerOpen(true)
        }}
        pagination={<Pagination page={page} total={total} count={count} onChange={setPage} />}
      />

      {pickerOpen && (
        <TemplatePicker
          platform={platform}
          regionCode={regionCode}
          templates={templates}
          onPlatformChange={selectPlatform}
          onRegionChange={selectRegion}
          onStartBlank={startBlank}
          onStartFromTemplate={startFromTemplate}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {draft && (
        <AgentEditor
          draft={draft}
          sourceTemplate={sourceTemplate}
          inheritedKnowledgeCount={knowledgeByAgent.get(draft.templateId) ?? 0}
          boundAccounts={accountsByAgent.get(draft.id) ?? 0}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={save}
        />
      )}

      <Modal
        open={!!deleteTarget}
        title="删除 AI 客服"
        onClose={() => setDeleteTarget(null)}
        width={448}
        footer={
          <>
            <button type="button" className="btn-ghost" onClick={() => setDeleteTarget(null)}>
              取消
            </button>
            <button type="button" className="btn-primary bg-danger hover:bg-danger/90" onClick={confirmDelete}>
              确认删除
            </button>
          </>
        }
      >
        <p className="text-sm leading-6">
          确定删除「<b>{deleteTarget?.name}</b>」吗？删除后其提示词配置将被移除，已关联的知识资料需重新绑定。
          {deleteTarget && (accountsByAgent.get(deleteTarget.id) ?? 0) > 0 && (
            <span className="mt-2 block rounded-lg bg-warn-bg px-3 py-2 text-xs text-warn">当前有 {accountsByAgent.get(deleteTarget.id)} 个渠道账号绑定了它，删除后这些账号将停止 AI 自动接待。</span>
          )}
        </p>
      </Modal>
    </div>
  )
}

function AiCustomerList({
  regionCode,
  regionCounts,
  platform,
  templateCountByType,
  templates,
  publicTemplates,
  knowledgeByAgent,
  accountsByAgent,
  rows,
  total,
  notice,
  onClearNotice,
  onRegionChange,
  onPlatformChange,
  onStartFromTemplate,
  onEdit,
  onToggle,
  onDelete,
  onCreate,
  pagination,
}: {
  regionCode: string
  regionCounts: Map<string, number>
  platform: AiPlatform
  templateCountByType: Map<AiPlatform, number>
  templates: AiTemplate[]
  publicTemplates: AiTemplate[]
  knowledgeByAgent: Map<string, number>
  accountsByAgent: Map<string, number>
  rows: AiAgent[]
  total: number
  notice: string
  onClearNotice: () => void
  onRegionChange: (code: string) => void
  onPlatformChange: (p: AiPlatform) => void
  onStartFromTemplate: (t: AiTemplate) => void
  onEdit: (a: AiAgent) => void
  onToggle: (a: AiAgent) => void
  onDelete: (a: AiAgent) => void
  onCreate: () => void
  pagination: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [regionSearch, setRegionSearch] = useState('')
  const region = regionOption(regionCode)
  const publicCount = publicTemplates.length
  const visibleRegions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase()
    if (!q) return AI_REGION_OPTIONS
    return AI_REGION_OPTIONS.filter((o) => `${o.code} ${o.country} ${o.language}`.toLowerCase().includes(q))
  }, [regionSearch])

  return (
    <section className="card overflow-hidden">
      <div className="flex min-h-20 flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          className="group flex min-w-[290px] items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left shadow-sm transition-colors duration-150 hover:border-line/35"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-line/10 text-line-text">
            <Globe2 size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium text-muted">当前国家／语言</span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-text">
              {region.country} · {region.language}
            </span>
          </span>
          <span className="rounded-md bg-card2 px-2 py-1 text-xs font-semibold text-muted">{region.code}</span>
          <ChevronDown size={16} className={clsx('text-muted transition-transform duration-150', menuOpen && 'rotate-180')} />
        </button>
        <div className="hidden text-xs text-muted sm:block">
          当前平台 {publicCount + total} 个模板 · 公共 {publicCount} · 自定义 {total}
        </div>
        <button type="button" className="btn-primary ml-auto h-9 shrink-0" onClick={onCreate}>
          <Plus size={16} />
          新建 AI 客服
        </button>
      </div>

      {menuOpen && (
        <div className="animate-fade-in border-b border-border bg-card2/40 p-4">
          <div className="mb-3 max-w-sm">
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input h-9 pl-9 text-sm" value={regionSearch} onChange={(e) => setRegionSearch(e.target.value)} placeholder="搜索国家或语言" aria-label="搜索国家或语言" autoFocus />
            </label>
          </div>
          {visibleRegions.length ? (
            <div className="scroll-thin grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
              {visibleRegions.map((o) => {
                const active = o.code === regionCode
                return (
                  <button
                    key={o.code}
                    type="button"
                    onClick={() => {
                      onRegionChange(o.code)
                      setMenuOpen(false)
                    }}
                    className={clsx('flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150', active ? 'border-line/30 bg-line/10' : 'border-border bg-card hover:border-line/25')}
                  >
                    <span className={clsx('inline-flex h-8 min-w-8 items-center justify-center rounded-md text-[11px] font-semibold', active ? 'bg-line/15 text-line-text' : 'bg-card2 text-muted')}>{o.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{o.country}</span>
                      <span className="block text-xs text-muted">
                        {o.language} · {regionCounts.get(o.code) ?? 0} 个模板
                      </span>
                    </span>
                    {active && <Check size={15} className="shrink-0 text-line-text" />}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card py-8 text-center text-sm text-muted">未找到匹配的国家或语言</div>
          )}
        </div>
      )}

      <div className="grid gap-4 border-b border-border p-5 lg:grid-cols-2">
        {CHANNEL_GROUPS.map((group) => (
          <section key={group.label} className="rounded-xl border border-border bg-card2/40 p-3.5">
            <div className="mb-3">
              <div className="text-sm font-semibold text-text">{group.label}</div>
              <div className="mt-0.5 text-xs text-muted">{group.note}</div>
            </div>
            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label={group.label}>
              {group.platforms.map((p) => {
                const active = p === platform
                return (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onPlatformChange(p)}
                    className={clsx(
                      'flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left transition-colors duration-150',
                      active ? 'border-line/30 bg-card font-medium text-text shadow-sm' : 'border-transparent bg-card/60 text-muted hover:border-border hover:bg-card',
                    )}
                  >
                    <PlatformIcon platform={p} className="!h-7 !w-7 rounded-lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{p}</span>
                      <span className="tnum block text-[11px] text-muted">{templateCountByType.get(p) ?? 0} 个公共模板</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card2">
            <PlatformIcon platform={platform} className="!h-5 !w-5" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-xs text-muted">
              {region.country}／{region.language} · {groupLabelFor(platform)} · {platform}
            </div>
            <h1 className="mt-0.5 truncate text-base font-semibold text-text">
              AI 客服提示词模板 <span className="tnum ml-1 text-sm font-normal text-muted">{total + publicCount} 个</span>
            </h1>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
          <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
          状态与渠道实时同步
        </div>
      </div>

      {notice && (
        <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-4 py-3 text-sm text-[#0284C7]">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
          <button type="button" className="ml-auto shrink-0 text-xs opacity-70 hover:opacity-100" onClick={onClearNotice}>
            关闭
          </button>
        </div>
      )}

      {total || publicCount ? (
        <div className="border-t border-border bg-card2/30 p-4 sm:p-5">
          <div className="space-y-2.5">
            {publicTemplates.map((t) => (
              <PublicTemplateRow key={t.id} template={t} knowledgeCount={knowledgeByAgent.get(t.id) ?? 0} onStart={onStartFromTemplate} />
            ))}
            {rows.map((a) => (
              <AssistantRow
                key={a.id}
                agent={a}
                templates={templates}
                knowledgeCount={knowledgeByAgent.get(a.id) ?? 0}
                accountCount={accountsByAgent.get(a.id) ?? 0}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyAssistants region={region} platform={platform} templateCount={templateCountByType.get(platform) ?? 0} onCreate={onCreate} />
      )}
      <div className="px-5 pb-4">{pagination}</div>
    </section>
  )
}

function PublicTemplateRow({ template, knowledgeCount, onStart }: { template: AiTemplate; knowledgeCount: number; onStart: (t: AiTemplate) => void }) {
  const region = regionOption(template.regionCode)
  return (
    <article className="rounded-xl border border-line/25 bg-card p-4 shadow-sm transition-colors duration-150 hover:border-line/40">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line/20 bg-line/10 text-line-text">
            <Bot size={19} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-text">{template.name}</h3>
              <span className="pill-on">公共</span>
            </div>
            <div className="mt-1 text-xs leading-5 text-muted">
              {region.code} · {region.country} · {region.language} · 平台公共模板
            </div>
            <p className="mt-1.5 line-clamp-1 max-w-2xl text-xs leading-5 text-muted">{template.description || template.rolePrompt}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 xl:min-w-[320px]">
          <KnowledgeChip count={knowledgeCount} />
          <button type="button" className="btn-primary shrink-0 py-1.5 text-xs" onClick={() => onStart(template)}>
            <Sparkles size={13} />
            基于该模板创建
          </button>
        </div>
      </div>
    </article>
  )
}

function AssistantRow({
  agent,
  templates,
  knowledgeCount,
  accountCount,
  onEdit,
  onToggle,
  onDelete,
}: {
  agent: AiAgent
  templates: AiTemplate[]
  knowledgeCount: number
  accountCount: number
  onEdit: (a: AiAgent) => void
  onToggle: (a: AiAgent) => void
  onDelete: (a: AiAgent) => void
}) {
  const region = regionOption(agent.regionCode)
  const templateName = agent.templateId ? templates.find((t) => t.id === agent.templateId)?.name ?? agent.templateId : '自定义模板'
  const paused = agent.status === 'paused'
  return (
    <article className={clsx('rounded-xl border border-border bg-card p-4 shadow-sm transition-colors duration-150 hover:border-line/25', paused && 'bg-card/80')}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card2">
            <PlatformIcon platform={agent.platform} className="!h-6 !w-6" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-text">{agent.name}</h3>
              <span className="pill-info max-w-28 truncate" title={agent.creator}>
                {compactAccountName(agent.creator)}
              </span>
              {paused && <span className="pill-off">已停用</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-1 text-xs leading-5 text-muted">
              <span>
                {region.code} · {region.country} · {region.language} · {templateName}
              </span>
              <span className="inline-flex items-center gap-1">
                · <Link2 size={11} /> 已绑定 {accountCount} 个账号
              </span>
            </div>
            <p className="mt-1.5 line-clamp-1 max-w-2xl text-xs leading-5 text-muted">{agentSummary(agent)}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 xl:min-w-[440px]">
          <div className="tnum text-[11px] text-muted">最近更新 {fmtTime(agent.updatedAt)}</div>
          <div className="flex items-center justify-end gap-1.5">
            <KnowledgeChip count={knowledgeCount} />
            <button type="button" className="btn-ghost shrink-0 py-1.5 text-xs" onClick={() => onEdit(agent)}>
              <PencilLine size={13} />
              编辑
            </button>
            <button type="button" className="btn-ghost shrink-0 py-1.5 text-xs" onClick={() => onToggle(agent)}>
              {paused ? <PlayCircle size={13} className="text-line-text" /> : <PauseCircle size={13} />}
              {paused ? '启用' : '停用'}
            </button>
            <button type="button" className="btn-ghost shrink-0 py-1.5 text-xs text-danger hover:bg-danger/5 hover:text-danger" onClick={() => onDelete(agent)}>
              <Trash2 size={13} />
              删除
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function KnowledgeChip({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card2 px-3 py-2 text-xs font-medium text-text">
      <Database size={13} className="text-line-text" />
      知识资料 · {count} 份已关联
    </span>
  )
}

function EmptyAssistants({ region, platform, templateCount, onCreate }: { region: AiRegionOption; platform: AiPlatform; templateCount: number; onCreate: () => void }) {
  return (
    <div className="border-t border-border bg-card2/30 p-4 sm:p-5">
      <div className="grid min-h-64 overflow-hidden rounded-2xl border border-dashed border-border bg-card lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card2 shadow-sm">
              <PlatformIcon platform={platform} className="!h-7 !w-7" />
            </span>
            <div>
              <div className="text-xs text-muted">当前范围</div>
              <div className="mt-0.5 text-sm font-semibold text-text">
                {region.country}／{region.language} · {platform}
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-text">还没有创建 AI 客服模板</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
            {templateCount > 0 ? `当前有 ${templateCount} 个预置模板可用，选择后补充人设与业务资料即可启用。` : '当前平台暂无预置模板，你仍然可以空白创建并填写人设、业务资料和知识来源。'}
          </p>
          <button type="button" className="btn-primary mt-5 w-fit" onClick={onCreate}>
            <Plus size={15} />
            新建 AI 客服
          </button>
        </div>
        <div className="relative hidden items-center justify-center border-l border-border bg-card2/30 lg:flex" aria-hidden>
          <div className="absolute h-28 w-48 -translate-x-6 -translate-y-4 rotate-[-5deg] rounded-2xl border border-border bg-card opacity-55 shadow-sm" />
          <div className="absolute h-28 w-48 translate-x-7 translate-y-5 rotate-[4deg] rounded-2xl border border-border bg-card opacity-70 shadow-sm" />
          <div className="relative w-52 rounded-2xl border border-border bg-card p-4 shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-line/10 text-line-text">
                <Bot size={18} />
              </span>
              <div className="h-2.5 w-24 rounded-full bg-border" />
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-card2" />
            <div className="mt-2 h-2 w-3/4 rounded-full bg-card2" />
            <div className="mt-4 flex gap-2">
              <span className="h-6 w-14 rounded-md bg-line/10" />
              <span className="h-6 w-16 rounded-md bg-card2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
