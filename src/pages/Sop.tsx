import { useState } from 'react'
import clsx from 'clsx'
import { Plus, Sparkles, Zap, Trash2, Users, MessageCircleReply, Pencil } from 'lucide-react'
import { useStore } from '../store'
import { uid } from '../lib/meta'
import type { SopFlow } from '../types'
import { Button, Drawer, Field, PageHeader, Toggle } from '../components/ui'

const TRIGGERS = ['新添加好友且 AI 判定为询价', '阶段变为「已报价」', '阶段变为「已成交」', '14 天无互动', '被打上标签「要样品」', '群发后客户回复']

export default function Sop() {
  const sops = useStore((s) => s.sops)
  const { toggleSop, saveSop, toast } = useStore()
  const [edit, setEdit] = useState<SopFlow | null>(null)

  return (
    <>
      <PageHeader
        title="SOP 自动跟进"
        desc="设定好触发条件和节奏，系统按天自动给客户发跟进消息。开启「AI 个性化」后，每条消息会根据客户资料和聊天记录改写。客户回复后 SOP 自动暂停，交给 AI 客服接待。"
        actions={
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setEdit({ id: uid('s'), name: '新建 SOP', trigger: TRIGGERS[0], enabled: false, enrolled: 0, replyRate: 0, steps: [{ id: uid('st'), day: 0, hour: 0, content: '', aiPersonalize: true }] })}
          >
            新建 SOP
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sops.map((s) => (
          <div key={s.id} className={clsx('card flex flex-col p-4 transition-opacity', !s.enabled && 'opacity-75')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{s.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                  <Zap size={12} className="text-amber-500" /> 触发：{s.trigger}
                </p>
              </div>
              <Toggle
                checked={s.enabled}
                onChange={() => {
                  toggleSop(s.id)
                  toast(s.enabled ? `已停用「${s.name}」` : `已启用「${s.name}」`, s.enabled ? 'info' : 'success')
                }}
              />
            </div>
            <ol className="mt-4 flex-1 space-y-0">
              {s.steps.map((st, i) => (
                <li key={st.id} className="relative flex gap-3 pb-3">
                  {i < s.steps.length - 1 && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-stone-200" />}
                  <span className="tnum z-[1] flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[11px] font-semibold text-stone-500">D{st.day}</span>
                  <div className="min-w-0 pt-1">
                    <p className="text-[13px] leading-snug text-stone-700">{st.content}</p>
                    {st.aiPersonalize && (
                      <span className="pill-ai mt-1 px-1.5 py-0 text-[11px]">
                        <Sparkles size={10} /> AI 个性化
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-2 flex items-center gap-4 border-t border-stone-100 pt-3 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Users size={13} /> 进行中 <b className="tnum font-semibold text-ink">{s.enrolled}</b>
              </span>
              <span className="flex items-center gap-1">
                <MessageCircleReply size={13} /> 回复率 <b className="tnum font-semibold text-ink">{s.replyRate}%</b>
              </span>
              <Button size="sm" variant="ghost" className="ml-auto" icon={<Pencil size={12} />} onClick={() => setEdit(structuredClone(s))}>
                编辑
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={!!edit} onClose={() => setEdit(null)} title="编辑 SOP" width={560}>
        {edit && (
          <div className="space-y-5 p-5">
            <Field label="名称">
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="input" />
            </Field>
            <Field label="触发条件">
              <select value={edit.trigger} onChange={(e) => setEdit({ ...edit, trigger: e.target.value })} className="input">
                {TRIGGERS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <div>
              <p className="label">跟进步骤</p>
              <div className="space-y-2.5">
                {edit.steps.map((st, i) => (
                  <div key={st.id} className="rounded-xl border border-stone-200 p-3">
                    <div className="mb-2 flex items-center gap-2 text-[13px]">
                      <span className="text-stone-500">第</span>
                      <input
                        type="number"
                        min={0}
                        value={st.day}
                        onChange={(e) => setEdit({ ...edit, steps: edit.steps.map((x) => (x.id === st.id ? { ...x, day: Number(e.target.value) } : x)) })}
                        className="input tnum h-7 w-16 px-2"
                      />
                      <span className="text-stone-500">天，客户当地</span>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={st.hour}
                        onChange={(e) => setEdit({ ...edit, steps: edit.steps.map((x) => (x.id === st.id ? { ...x, hour: Number(e.target.value) } : x)) })}
                        className="input tnum h-7 w-16 px-2"
                      />
                      <span className="text-stone-500">点</span>
                      <button
                        onClick={() => setEdit({ ...edit, steps: edit.steps.filter((x) => x.id !== st.id) })}
                        disabled={edit.steps.length === 1}
                        className="ml-auto rounded p-1 text-stone-400 hover:text-red-500 disabled:opacity-30"
                        aria-label={`删除第 ${i + 1} 步`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={st.content}
                      onChange={(e) => setEdit({ ...edit, steps: edit.steps.map((x) => (x.id === st.id ? { ...x, content: e.target.value } : x)) })}
                      rows={2}
                      className="textarea text-[13px]"
                      placeholder="这一步要对客户说什么，或描述意图让 AI 来写"
                    />
                    <label className="mt-2 flex items-center justify-between text-xs text-stone-600">
                      <span className="flex items-center gap-1">
                        <Sparkles size={12} className="text-ai" /> AI 根据客户资料个性化改写
                      </span>
                      <Toggle checked={st.aiPersonalize} onChange={(v) => setEdit({ ...edit, steps: edit.steps.map((x) => (x.id === st.id ? { ...x, aiPersonalize: v } : x)) })} />
                    </label>
                  </div>
                ))}
              </div>
              <Button
                className="mt-2.5 w-full border-dashed"
                icon={<Plus size={14} />}
                onClick={() => {
                  const last = edit.steps[edit.steps.length - 1]
                  setEdit({ ...edit, steps: [...edit.steps, { id: uid('st'), day: (last?.day ?? 0) + 3, hour: 10, content: '', aiPersonalize: true }] })
                }}
              >
                添加步骤
              </Button>
            </div>
            <div className="rounded-lg bg-stone-50 px-3 py-2.5 text-xs leading-relaxed text-stone-500">
              客户在任意一步回复后，SOP 会自动暂停并交给账号绑定的 AI 客服接待；客户进入「已成交」或「已流失」阶段时自动退出。
            </div>
            <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
              <Button onClick={() => setEdit(null)}>取消</Button>
              <Button
                variant="primary"
                onClick={() => {
                  saveSop(edit)
                  setEdit(null)
                  toast('SOP 已保存')
                }}
              >
                保存
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}
