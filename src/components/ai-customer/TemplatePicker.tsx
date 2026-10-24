import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Bot, Plus, Search, Sparkles } from 'lucide-react'
import { Modal } from '../ui'
import { PlatformIcon } from '../PlatformIcon'
import { AI_REGION_OPTIONS, IM_AI_PLATFORMS, PICKER_PLATFORMS, regionOption, templateMatches } from '../../lib/ai-customer'
import type { AiPlatform, AiTemplate } from '../../types'

/** 新建 AI 客服模板：国家／语言 → 平台 → 空白创建或从公共预设模板开始。 */
export function TemplatePicker({
  platform,
  regionCode,
  templates,
  onPlatformChange,
  onRegionChange,
  onStartBlank,
  onStartFromTemplate,
  onClose,
}: {
  platform: AiPlatform
  regionCode: string
  templates: AiTemplate[]
  onPlatformChange: (p: AiPlatform) => void
  onRegionChange: (code: string) => void
  onStartBlank: () => void
  onStartFromTemplate: (t: AiTemplate) => void
  onClose: () => void
}) {
  const [regionSearch, setRegionSearch] = useState('')
  const region = regionOption(regionCode)
  const visibleRegions = useMemo(() => {
    const q = regionSearch.trim().toLowerCase()
    if (!q) return AI_REGION_OPTIONS
    return AI_REGION_OPTIONS.filter((o) => `${o.code} ${o.country} ${o.language}`.toLowerCase().includes(q))
  }, [regionSearch])
  const pickerTemplates = templates.filter((t) => templateMatches(t, platform, regionCode))

  return (
    <Modal open title="新建 AI 客服模板" onClose={onClose} width={1152} footer={<button type="button" className="btn-ghost" onClick={onClose}>取消</button>}>
      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[240px_250px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-card2/35 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3">
            <div className="text-sm font-semibold text-text">国家／语言</div>
            <div className="mt-1 text-xs leading-5 text-muted">先确定模板适用地区</div>
          </div>
          <label className="relative block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input h-10 pl-9 text-sm" value={regionSearch} onChange={(e) => setRegionSearch(e.target.value)} placeholder="国家 / 语言" aria-label="搜索国家或语言" />
          </label>
          <div className="scroll-thin mt-4 max-h-[460px] space-y-1 overflow-y-auto pr-1">
            {visibleRegions.map((o) => {
              const count = templates.filter((t) => t.regionCode === o.code).length
              const active = o.code === regionCode
              return (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => onRegionChange(o.code)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                    active ? 'border-line/30 bg-line/10 text-text shadow-sm' : 'border-transparent text-muted hover:bg-card',
                  )}
                >
                  <span className={clsx('inline-flex min-w-8 justify-center rounded-md px-1.5 py-1 text-[11px] font-semibold', active ? 'bg-line/15 text-line-text' : 'bg-card text-muted')}>{o.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {o.country} · {o.language}
                  </span>
                  <span className="tnum text-xs">{count}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <aside className="border-b border-border bg-card p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3">
            <div className="text-sm font-semibold text-text">平台</div>
            <div className="mt-1 text-xs leading-5 text-muted">选择模板所属平台</div>
          </div>
          <div className="space-y-1.5">
            {PICKER_PLATFORMS.map((p) => {
              const active = p === platform
              const count = templates.filter((t) => templateMatches(t, p, regionCode)).length
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPlatformChange(p)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                    active ? 'border-line/30 bg-line/10 text-text shadow-sm' : 'border-transparent text-muted hover:bg-card2',
                  )}
                >
                  <PlatformIcon platform={p} className="!h-8 !w-8 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p}</span>
                    <span className="tnum mt-0.5 block text-xs text-muted">{count} 个模板</span>
                  </span>
                  <span className={clsx('rounded-md px-1.5 py-1 text-[10px] font-medium', active ? 'bg-card text-line-text' : 'bg-card2 text-muted')}>
                    {IM_AI_PLATFORMS.includes(p) ? 'IM' : '社媒'}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="min-w-0 p-5">
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text">提示词模板</div>
              <div className="mt-1 truncate text-xs leading-5 text-muted">
                {region.country} · {region.language} · {platform}
              </div>
            </div>
            <span className="tnum shrink-0 rounded-lg bg-card2 px-2.5 py-1.5 text-xs text-muted">{pickerTemplates.length} 个</span>
          </div>
          <div className="scroll-thin max-h-[470px] space-y-2.5 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={onStartBlank}
              className="flex w-full items-start gap-3.5 rounded-xl border border-dashed border-border bg-card p-4 text-left transition-colors duration-150 hover:border-line/45 hover:bg-line/[0.03]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-line/10 text-line-text">
                <Plus size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-text">空白创建</span>
                  <span className="pill-info shrink-0">从零开始</span>
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-muted">不套用预置内容，直接填写人设与业务资料。</span>
                <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-line-text">
                  <Sparkles size={13} />
                  创建空白模板
                </span>
              </span>
            </button>

            {pickerTemplates.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => onStartFromTemplate(t)}
                className="flex w-full items-start gap-3.5 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors duration-150 hover:border-line/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-line/10 text-line-text">
                  <Bot size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-text">{t.name}</span>
                    <span className="pill-on shrink-0">公共预设模板</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-muted">{t.rolePrompt || t.description}</span>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-line-text">
                    <Sparkles size={13} />
                    查看并创建
                  </span>
                </span>
              </button>
            ))}
            {pickerTemplates.length === 0 && (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card2/20 p-5 text-center">
                <Bot size={20} className="text-muted" />
                <div className="mt-2 text-sm font-medium text-text">暂无预置模板</div>
                <div className="mt-1 text-xs leading-5 text-muted">可以使用上方的空白创建继续配置。</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </Modal>
  )
}
