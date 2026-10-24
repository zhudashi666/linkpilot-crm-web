import { useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import clsx from 'clsx'
import { Bot, CheckCircle2, ChevronDown, Eye, FileText, Globe2, Layers, Link2, NotebookPen, Plus, UploadCloud } from 'lucide-react'
import { useStore } from '../store'
import { KpiGrid, Modal, PageHeader, Pagination, usePagination } from '../components/ui'
import { PlatformIcon } from '../components/PlatformIcon'
import { IM_AI_PLATFORMS, KNOWLEDGE_ASSOCIATION_LIMIT as LIMIT, PICKER_PLATFORMS, TEMPLATE_PREFIX, regionOption } from '../lib/ai-customer'
import { fmtTime } from '../lib/meta'
import type { AiPlatform, KnowledgeDoc, KnowledgeSource } from '../types'

const PAGE_SIZE = 10
const TITLE_MAX = 20
const MANUAL_MAX = 20_000
const ACCEPT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'md']

/** 关联弹窗里的可选对象：自定义 AI 客服 + 公共模板（id 带 template: 前缀） */
interface AiCandidate {
  id: string
  name: string
  platform: AiPlatform
  regionCode: string
  isPublic: boolean
  paused: boolean
  subtitle: string
}

interface SourceDraft {
  type: 'web' | 'manual'
  title: string
  value: string
}

const SOURCE_META: Record<KnowledgeSource, { label: string; icon: typeof FileText }> = {
  document: { label: '文档', icon: FileText },
  web: { label: '网页', icon: Globe2 },
  manual: { label: '手工填写', icon: NotebookPen },
}

function shortPreview(body?: string) {
  const s = body?.replace(/\s+/g, ' ').trim() || '暂无正文'
  return s.length > 64 ? `${s.slice(0, 64)}…` : s
}

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const linkCount = (k: KnowledgeDoc) => k.assistantIds.length + k.templateIds.length

export default function Knowledge() {
  const items = useStore((s) => s.knowledge)
  const agents = useStore((s) => s.agents)
  const templates = useStore((s) => s.templates)
  const addKnowledge = useStore((s) => s.addKnowledge)
  const updateKnowledge = useStore((s) => s.updateKnowledge)
  const setKnowledgeLinks = useStore((s) => s.setKnowledgeLinks)

  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [sourceDraft, setSourceDraft] = useState<SourceDraft | null>(null)
  const [assocId, setAssocId] = useState<string | null>(null)
  const [assocDraft, setAssocDraft] = useState<string[]>([])
  const [assocError, setAssocError] = useState('')
  const [viewId, setViewId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ title: string; body: string } | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const candidates = useMemo<AiCandidate[]>(
    () => [
      ...agents.map((a) => ({ id: a.id, name: a.name, platform: a.platform, regionCode: a.regionCode, isPublic: false, paused: a.status === 'paused', subtitle: a.role || '当前账号自定义模板' })),
      ...templates.map((t) => ({ id: `${TEMPLATE_PREFIX}${t.id}`, name: t.name, platform: t.platform, regionCode: t.regionCode, isPublic: true, paused: false, subtitle: t.description || '公共预设模板' })),
    ],
    [agents, templates],
  )
  const { page, total, setPage, rows, count } = usePagination(items, PAGE_SIZE)
  const assocItem = items.find((k) => k.id === assocId) ?? null
  const viewItem = items.find((k) => k.id === viewId) ?? null

  function done(msg: string) {
    setError('')
    setNotice(msg)
  }

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    const valid = list.filter((f) => ACCEPT.includes(f.name.split('.').pop()?.toLowerCase() ?? ''))
    const skipped = list.length - valid.length
    if (fileRef.current) fileRef.current.value = ''
    if (!valid.length) {
      setNotice('')
      setError(`所选文件格式不在支持范围（PDF、DOC、DOCX、XLS、XLSX、TXT、Markdown）内，已跳过 ${skipped} 个文件。`)
      return
    }
    for (const f of valid) addKnowledge({ name: f.name.replace(/\.[^.]+$/, '').slice(0, TITLE_MAX), source: 'document', detail: `${f.name} · ${fileSize(f.size)}` })
    done(`已把 ${valid.length} 个文件加入知识资料列表${skipped ? `，跳过 ${skipped} 个不支持的格式` : ''}。`)
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function saveSourceDraft() {
    if (!sourceDraft || !sourceDraft.title.trim() || !sourceDraft.value.trim()) return
    if (sourceDraft.type === 'web') {
      if (!/^https?:\/\//i.test(sourceDraft.value.trim())) {
        setError('网页链接需以 http:// 或 https:// 开头。')
        return
      }
      addKnowledge({ name: sourceDraft.title.trim(), source: 'web', detail: sourceDraft.value.trim() })
      done('已记录网页来源，抓取、解析与索引由服务端处理。')
    } else {
      addKnowledge({ name: sourceDraft.title.trim(), source: 'manual', detail: '', body: sourceDraft.value })
      done('已保存手工资料正文，可从列表查看和编辑。')
    }
    setSourceDraft(null)
  }

  function openAssociation(k: KnowledgeDoc) {
    setAssocId(k.id)
    setAssocDraft([...k.assistantIds, ...k.templateIds.map((id) => `${TEMPLATE_PREFIX}${id}`)])
    setAssocError('')
  }

  function toggleAssociation(id: string) {
    if (assocDraft.includes(id)) {
      setAssocError('')
      setAssocDraft(assocDraft.filter((x) => x !== id))
      return
    }
    if (assocDraft.length >= LIMIT) {
      setAssocError(`每份知识资料最多关联 ${LIMIT} 个 AI 客服。`)
      return
    }
    setAssocError('')
    setAssocDraft([...assocDraft, id])
  }

  function saveAssociations() {
    if (!assocId) return
    setKnowledgeLinks(
      assocId,
      assocDraft.filter((id) => !id.startsWith(TEMPLATE_PREFIX)),
      assocDraft.filter((id) => id.startsWith(TEMPLATE_PREFIX)).map((id) => id.slice(TEMPLATE_PREFIX.length)),
    )
    done('已更新 AI 关联；保存关联后资料默认可用于所选 AI。')
    setAssocId(null)
  }

  function saveManualEdit() {
    if (!viewItem || !editDraft?.title.trim() || !editDraft.body.trim()) return
    updateKnowledge(viewItem.id, { name: editDraft.title.trim(), body: editDraft.body })
    done('已保存手工资料修改。')
    setEditDraft(null)
  }

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title="知识库" desc="企业全局资料库；每份文档、网页或手工资料都可关联一个或多个 AI 客服。" />

      <KpiGrid
        items={[
          { label: '全部资料', value: items.length, icon: <Layers size={17} /> },
          { label: '文档', value: items.filter((k) => k.source === 'document').length, icon: <FileText size={17} /> },
          { label: '网页', value: items.filter((k) => k.source === 'web').length, icon: <Globe2 size={17} /> },
          { label: '手工填写', value: items.filter((k) => k.source === 'manual').length, icon: <NotebookPen size={17} /> },
        ]}
      />

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-3.5">
          <div>
            <h2 className="font-semibold text-text">资料接入</h2>
            <p className="mt-0.5 text-xs text-muted">从文档、网页或手工内容建立可关联的业务资料。</p>
          </div>
          <span className="pill-muted">3 种来源</span>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
          <section
            className={clsx('rounded-xl border border-dashed p-6 transition-colors', dragging ? 'border-line bg-line-dark/60 shadow-glow' : 'border-border bg-card2/30 hover:border-line/40')}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setDragging(false)
            }}
            onDrop={handleDrop}
          >
            <div className="flex min-h-36 flex-col items-center justify-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-line-dark text-line-text">
                <UploadCloud size={22} />
              </span>
              <div className="mt-3 font-semibold">拖拽文档到这里</div>
              <div className="mt-1 text-xs text-muted">支持 PDF、DOCX、XLSX、TXT、Markdown；文件会上传并登记到知识库。</div>
              <button type="button" className="btn-primary mt-4" onClick={() => fileRef.current?.click()}>
                <Plus size={15} />
                选择文档
              </button>
              <input ref={fileRef} hidden multiple type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md" onChange={(e) => e.target.files && addFiles(e.target.files)} />
            </div>
          </section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <SourceCard icon={<Globe2 size={18} />} title="添加网页链接" desc="记录网页来源；抓取与更新由服务端处理。" onClick={() => setSourceDraft({ type: 'web', title: '', value: '' })} />
            <SourceCard icon={<NotebookPen size={18} />} title="手工填写资料" desc="正文会保存到知识库中，并可随时查看。" onClick={() => setSourceDraft({ type: 'manual', title: '', value: '' })} />
          </div>
        </div>
      </section>

      {notice && (
        <div className="flex gap-2 rounded-xl border border-info/25 bg-info/10 px-4 py-3 text-sm text-[#0284C7]">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          {notice}
        </div>
      )}
      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

      <section className="panel overflow-visible">
        <div className="card-header">
          <div>
            <h2 className="font-semibold">知识资料</h2>
            <div className="mt-1 text-xs text-muted">保存 AI 关联后默认可用</div>
          </div>
          <span className="pill-info ml-auto">{items.length} 条</span>
        </div>
        {items.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>资料</th>
                <th>来源</th>
                <th>关联 AI 客服</th>
                <th className="w-40">更新时间</th>
                <th className="w-48 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => {
                const meta = SOURCE_META[k.source]
                const linked = candidates.filter((c) => (c.isPublic ? k.templateIds.includes(c.id.slice(TEMPLATE_PREFIX.length)) : k.assistantIds.includes(c.id)))
                return (
                  <tr key={k.id}>
                    <td>
                      <div className="flex min-w-48 items-center gap-2">
                        <meta.icon size={16} className="shrink-0 text-info" />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{k.name}</div>
                          <div className="mt-1 max-w-72 truncate text-xs text-muted">{k.source === 'manual' ? shortPreview(k.body) : k.detail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pill-info">{meta.label}</span>
                    </td>
                    <td className="w-[260px]">
                      <LinkedAssistants count={linkCount(k)} linked={linked} />
                    </td>
                    <td className="tnum text-[13px] text-muted">{fmtTime(k.updatedAt)}</td>
                    <td className="whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {k.source === 'manual' && (
                          <button
                            type="button"
                            className="btn-ghost min-h-8 shrink-0 px-2 py-1.5 text-xs"
                            onClick={() => {
                              setViewId(k.id)
                              setEditDraft(null)
                            }}
                          >
                            <Eye size={13} />
                            查看正文
                          </button>
                        )}
                        <button type="button" className="btn-ghost min-h-8 shrink-0 px-2 py-1.5 text-xs" onClick={() => openAssociation(k)}>
                          <Link2 size={13} />
                          管理关联
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="card-body py-12 text-center">
            <FileText size={28} className="mx-auto mb-3 text-muted" />
            <div className="font-medium">暂无知识资料</div>
            <div className="mt-1 text-xs text-muted">可从上方选择文档、网页链接或手工填写。</div>
          </div>
        )}
        <div className="border-t border-divider px-5 pb-4">
          <Pagination page={page} total={total} count={count} onChange={setPage} />
        </div>
      </section>

      {sourceDraft && <SourceDraftModal draft={sourceDraft} onChange={setSourceDraft} onClose={() => setSourceDraft(null)} onSave={saveSourceDraft} />}

      {assocItem && (
        <AssociationModal
          item={assocItem}
          candidates={candidates}
          selectedIds={assocDraft}
          error={assocError}
          onToggle={toggleAssociation}
          onClose={() => setAssocId(null)}
          onSave={saveAssociations}
        />
      )}

      {viewItem && (
        <Modal
          open
          title={editDraft ? '编辑手工资料' : '查看手工资料正文'}
          onClose={() => {
            setViewId(null)
            setEditDraft(null)
          }}
          width={672}
          footer={
            editDraft ? (
              <>
                <button type="button" className="btn-ghost" onClick={() => setEditDraft(null)}>
                  取消编辑
                </button>
                <button type="button" className="btn-primary" disabled={!editDraft.title.trim() || !editDraft.body.trim()} onClick={saveManualEdit}>
                  保存修改
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-ghost" onClick={() => setEditDraft({ title: viewItem.name, body: viewItem.body ?? '' })}>
                  编辑
                </button>
                <button type="button" className="btn-primary" onClick={() => setViewId(null)}>
                  关闭
                </button>
              </>
            )
          }
        >
          {editDraft ? (
            <div>
              <div className="mb-4 rounded-lg border border-warn/30 bg-warn-bg px-4 py-3 text-xs text-muted">修改会直接保存到知识库；名称最多 20 字，正文最多 20,000 字。</div>
              <CountedField label="资料名称" count={`${editDraft.title.length} / ${TITLE_MAX}`}>
                <input className="input" maxLength={TITLE_MAX} value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
              </CountedField>
              <CountedField label="完整正文" count={`${editDraft.body.length.toLocaleString('zh-CN')} / 20,000`}>
                <textarea className="input min-h-72" maxLength={MANUAL_MAX} value={editDraft.body} onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })} />
              </CountedField>
            </div>
          ) : (
            <div>
              <div className="font-semibold">{viewItem.name}</div>
              <div className="mb-4 mt-1 text-xs text-muted">完整正文保存在知识库，可随时编辑</div>
              <div className="scroll-thin max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-card2 px-4 py-4 text-sm leading-6">{viewItem.body || '暂无正文'}</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

function SourceCard({ icon, title, desc, onClick }: { icon: ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button type="button" className="card card-hover text-left" onClick={onClick}>
      <div className="card-body flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">{icon}</span>
        <span>
          <span className="block font-semibold">{title}</span>
          <span className="mt-1 block text-xs text-muted">{desc}</span>
        </span>
      </div>
    </button>
  )
}

function CountedField({ label, count, children }: { label: string; count?: string; children: ReactNode }) {
  return (
    <label className="mb-4 block last:mb-0">
      <span className="mb-1.5 flex items-center justify-between gap-3 text-xs text-muted">
        <span>{label}</span>
        {count && <span className="tnum">{count}</span>}
      </span>
      {children}
    </label>
  )
}

function SourceDraftModal({ draft, onChange, onClose, onSave }: { draft: SourceDraft; onChange: (d: SourceDraft) => void; onClose: () => void; onSave: () => void }) {
  const web = draft.type === 'web'
  return (
    <Modal
      open
      title={web ? '添加网页来源' : '手工填写资料'}
      onClose={onClose}
      width={672}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" disabled={!draft.title.trim() || !draft.value.trim()} onClick={onSave}>
            加入资料列表
          </button>
        </>
      }
    >
      <div className="mb-4 rounded-lg border border-warn/30 bg-warn-bg px-4 py-3 text-xs text-muted">
        {web ? '仅记录网页链接（须 http/https）；访问、抓取与定时更新由服务端处理。' : '正文会保存到知识库并可查看；保存后可随时编辑。'}
      </div>
      <CountedField label="资料名称" count={`${draft.title.length} / ${TITLE_MAX}`}>
        <input className="input" maxLength={TITLE_MAX} value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} placeholder={web ? '例如：海外物流服务范围' : '例如：活动常见问题'} autoFocus />
      </CountedField>
      <CountedField label={web ? '网页链接' : '资料正文'} count={web ? undefined : `${draft.value.length.toLocaleString('zh-CN')} / 20,000`}>
        {web ? (
          <input className="input" type="url" value={draft.value} onChange={(e) => onChange({ ...draft, value: e.target.value })} placeholder="https://example.com/help" />
        ) : (
          <textarea className="input min-h-64" maxLength={MANUAL_MAX} value={draft.value} onChange={(e) => onChange({ ...draft, value: e.target.value })} placeholder="可在此填写或粘贴业务政策、产品说明、服务流程或常见问答。" />
        )}
      </CountedField>
    </Modal>
  )
}

function countBadgeClass(n: number) {
  return n >= LIMIT ? 'bg-warn/10 text-warn' : 'bg-card text-muted'
}

function LinkedAssistants({ count, linked }: { count: number; linked: AiCandidate[] }) {
  if (!linked.length) return <span className="text-muted">{count ? `已关联 ${count} 个` : '未关联'}</span>
  return (
    <details className="group relative w-[238px]">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-card2/40 px-2.5 py-2 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex shrink-0 items-center pl-1">
          {linked.slice(0, 3).map((c, i) => (
            <span key={c.id} title={c.name} className={clsx('relative flex h-6 w-6 items-center justify-center rounded-full bg-card ring-2 ring-card', i && '-ml-1.5')}>
              <PlatformIcon platform={c.platform} className="!h-5 !w-5" />
            </span>
          ))}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-text">{linked.slice(0, 3).map((c) => c.name).join('、')}</span>
        <span className={clsx('tnum shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', countBadgeClass(count))}>
          {count}/{LIMIT}
        </span>
        <ChevronDown size={14} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-30 mt-1.5 w-[300px] rounded-xl border border-border bg-card p-2 shadow-elevated">
        <div className="px-2 pb-2 pt-1 text-[11px] font-medium text-muted">已关联 AI 客服</div>
        <div className="scroll-thin max-h-64 space-y-1 overflow-y-auto">
          {linked.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-card2">
              <PlatformIcon platform={c.platform} className="!h-7 !w-7" />
              <span className="min-w-0 flex-1 truncate text-sm text-text">{c.name}</span>
              <span className="shrink-0 text-[11px] text-muted">{c.isPublic ? '公共' : '自定义'}</span>
            </div>
          ))}
        </div>
      </div>
    </details>
  )
}

function AssociationModal({
  item,
  candidates,
  selectedIds,
  error,
  onToggle,
  onClose,
  onSave,
}: {
  item: KnowledgeDoc
  candidates: AiCandidate[]
  selectedIds: string[]
  error: string
  onToggle: (id: string) => void
  onClose: () => void
  onSave: () => void
}) {
  const initial = candidates.find((c) => selectedIds.includes(c.id)) ?? candidates[0]
  const [regionCode, setRegionCode] = useState(initial?.regionCode ?? 'MX')
  const [platform, setPlatform] = useState<AiPlatform>(initial?.platform ?? 'WhatsApp')

  const regions = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of candidates) map.set(c.regionCode, (map.get(c.regionCode) ?? 0) + 1)
    return [...map.entries()].map(([code, n]) => ({ ...regionOption(code), count: n })).sort((a, b) => b.count - a.count)
  }, [candidates])
  const scoped = candidates.filter((c) => c.regionCode === regionCode && c.platform === platform)
  const full = selectedIds.length >= LIMIT

  return (
    <Modal
      open
      title="关联 AI 客服"
      onClose={onClose}
      width={1152}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={onSave}>
            保存关联
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card2/40 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs text-muted">当前知识资料</div>
            <div className="mt-1 truncate font-semibold text-text">{item.name}</div>
          </div>
          <div className={clsx('tnum rounded-lg px-3 py-2 text-xs font-semibold', full ? 'bg-warn/10 text-warn' : 'bg-card text-muted')}>
            已选择 {selectedIds.length} / {LIMIT} 个 AI 客服
          </div>
        </div>
        {candidates.length ? (
          <div className="grid min-h-[430px] overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[230px_240px_minmax(0,1fr)]">
            <section className="border-b border-border p-4 lg:border-b-0 lg:border-r">
              <div className="font-semibold text-text">国家／地区</div>
              <div className="mt-1 text-xs text-muted">选择模板所属国家与语言</div>
              <div className="scroll-thin mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {regions.map((r) => {
                  const selected = regionCode === r.code
                  return (
                    <button
                      key={r.code}
                      type="button"
                      className={clsx(
                        'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                        selected ? 'border-line/40 bg-line/10 text-text' : 'border-transparent text-muted hover:border-border hover:bg-card2/50 hover:text-text',
                      )}
                      onClick={() => {
                        setRegionCode(r.code)
                        const first = PICKER_PLATFORMS.find((p) => candidates.some((c) => c.regionCode === r.code && c.platform === p))
                        if (first) setPlatform(first)
                      }}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card2 text-xs font-semibold">{r.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {r.country} · {r.language}
                        </span>
                        <span className="tnum mt-0.5 block text-xs text-muted">{r.count} 个模板</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
            <section className="border-b border-border p-4 lg:border-b-0 lg:border-r">
              <div className="font-semibold text-text">平台</div>
              <div className="mt-1 text-xs text-muted">IM 与社媒平台统一选择</div>
              <div className="mt-4 space-y-2">
                {PICKER_PLATFORMS.map((p) => {
                  const n = candidates.filter((c) => c.regionCode === regionCode && c.platform === p).length
                  const selected = platform === p
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={!n}
                      onClick={() => setPlatform(p)}
                      className={clsx(
                        'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                        selected ? 'border-line/40 bg-line/10 text-text' : 'border-transparent text-muted hover:border-border hover:bg-card2/50 hover:text-text',
                      )}
                    >
                      <PlatformIcon platform={p} className="!h-8 !w-8" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p}</span>
                        <span className="tnum mt-0.5 block text-xs text-muted">{n} 个模板</span>
                      </span>
                      <span className="shrink-0 rounded-md bg-card2 px-2 py-1 text-[11px] text-muted">{IM_AI_PLATFORMS.includes(p) ? 'IM' : '社媒'}</span>
                    </button>
                  )
                })}
              </div>
            </section>
            <section className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-text">AI 客服模板</div>
                  <div className="mt-1 text-xs text-muted">选择后将当前资料关联到对应 AI 客服</div>
                </div>
                <span className="tnum text-xs text-muted">{scoped.length} 个</span>
              </div>
              {scoped.length ? (
                <div className="scroll-thin mt-4 max-h-[380px] space-y-2 overflow-y-auto pr-1">
                  {scoped.map((c) => {
                    const checked = selectedIds.includes(c.id)
                    const disabled = !checked && full
                    return (
                      <label
                        key={c.id}
                        className={clsx(
                          'flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                          checked ? 'border-line/40 bg-line/10' : 'border-border bg-card hover:border-line/25',
                        )}
                      >
                        <input className="mt-1 accent-[#16C05B]" type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(c.id)} />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-line/10 text-line-text">
                          <Bot size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-text">{c.name}</span>
                            <span className={c.isPublic ? 'pill-on' : 'pill-info'}>{c.isPublic ? '公共' : '自定义'}</span>
                            {c.paused && <span className="pill-off">已停用</span>}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted">{c.subtitle}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-4 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card2/20 px-6 text-center">
                  <Bot size={22} className="text-muted" />
                  <div className="mt-3 text-sm font-medium text-text">当前范围暂无 AI 客服模板</div>
                  <div className="mt-1 text-xs leading-5 text-muted">可切换国家或平台继续查找。</div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">暂无 AI 客服，请先在 AI 客服页面创建。</div>
        )}
        {error && <div className="rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">{error}</div>}
      </div>
    </Modal>
  )
}
