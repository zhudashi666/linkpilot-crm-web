import { useState } from 'react'
import clsx from 'clsx'
import { RotateCcw, UserPlus } from 'lucide-react'
import { useStore, useMembers } from '../store'
import { Avatar, Badge, Button, Field, Modal, PageHeader, Tabs, Toggle } from '../components/ui'

type Tab = 'team' | 'roles' | 'general'

const ROLES = [
  { name: '管理员', desc: '全部权限，包括计费和账号管理', perms: ['全部'] },
  { name: '销售主管', desc: '查看团队全部客户和数据，分配客户', perms: ['全部客户', '数据分析', '群发', 'SOP'] },
  { name: '销售', desc: '只看分配给自己的客户和会话', perms: ['我的客户', '我的会话', '跟进任务'] },
  { name: '客服', desc: '处理售后会话，不能看商机金额', perms: ['会话', '知识库（只读）'] },
]

export default function SettingsPage() {
  const members = useMembers()
  const { reset, toast } = useStore()
  const [tab, setTab] = useState<Tab>('team')
  const [confirm, setConfirm] = useState(false)
  const [privacy, setPrivacy] = useState(true)
  const [nightAi, setNightAi] = useState(true)

  return (
    <>
      <PageHeader title="设置" desc="团队、权限与通用配置" />
      <div className="card">
        <Tabs<Tab>
          className="px-3"
          value={tab}
          onChange={setTab}
          items={[
            { key: 'team', label: '团队成员', count: members.length },
            { key: 'roles', label: '角色权限' },
            { key: 'general', label: '通用' },
          ]}
        />
        {tab === 'team' && (
          <div>
            <div className="flex justify-end px-5 py-3">
              <Button variant="primary" icon={<UserPlus size={14} />} onClick={() => toast('邀请链接已复制，发给同事即可加入', 'info')}>
                邀请成员
              </Button>
            </div>
            <table className="w-full text-[13px]">
              <thead className="bg-stone-50/80">
                <tr>
                  <th className="th">成员</th>
                  <th className="th">角色</th>
                  <th className="th">状态</th>
                  <th className="th">邮箱</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="td">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={m.name} color={m.color} size={28} />
                        <span className="font-medium">{m.name}</span>
                      </span>
                    </td>
                    <td className="td">
                      <Badge>{m.role}</Badge>
                    </td>
                    <td className="td">
                      <span className="flex items-center gap-1.5 text-stone-600">
                        <span className={clsx('h-1.5 w-1.5 rounded-full', m.online ? 'bg-brand-500' : 'bg-stone-300')} />
                        {m.online ? '在线' : '离线'}
                      </span>
                    </td>
                    <td className="td font-mono text-xs text-stone-500">{m.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'roles' && (
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {ROLES.map((r) => (
              <div key={r.name} className="rounded-xl border border-stone-200 p-4">
                <p className="font-semibold">{r.name}</p>
                <p className="mt-0.5 text-xs text-stone-500">{r.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.perms.map((p) => (
                    <Badge key={p} className="bg-brand-50 text-brand-700">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'general' && (
          <div className="max-w-2xl space-y-4 p-5">
            <Field label="团队名称">
              <input defaultValue="SolarVolt 出海团队" className="input" />
            </Field>
            <Field label="默认工作语言（你输入的语言）">
              <select className="input" defaultValue="zh">
                <option value="zh">简体中文</option>
                <option value="en">English</option>
              </select>
            </Field>
            <label className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3">
              <span>
                <span className="block text-[13.5px] font-medium">非工作时间 AI 全权接待</span>
                <span className="block text-xs text-stone-500">北京时间 22:00 – 08:00 不转人工，只记录并创建次日跟进任务</span>
              </span>
              <Toggle checked={nightAi} onChange={setNightAi} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3">
              <span>
                <span className="block text-[13.5px] font-medium">销售离职保护</span>
                <span className="block text-xs text-stone-500">隐藏客户完整手机号，禁止导出，客户和聊天记录归公司所有</span>
              </span>
              <Toggle checked={privacy} onChange={setPrivacy} />
            </label>
            <div className="flex items-center justify-between rounded-xl border border-dashed border-stone-300 px-4 py-3">
              <span>
                <span className="block text-[13.5px] font-medium">演示：算力只剩 1,500 点</span>
                <span className="block text-xs text-stone-500">用来体验余额不足：AI 回复一条后再来消息，会自动停止接待并转人工</span>
              </span>
              <Button
                onClick={() => {
                  useStore.setState((s) => ({ billing: { ...s.billing, points: 1_500 } }))
                  toast('算力余额已设为 1,500 点', 'info')
                }}
              >
                设置
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-dashed border-stone-300 px-4 py-3">
              <span>
                <span className="block text-[13.5px] font-medium">重置演示数据</span>
                <span className="block text-xs text-stone-500">原型的所有操作都保存在浏览器本地，重置后恢复初始示例数据</span>
              </span>
              <Button icon={<RotateCcw size={14} />} onClick={() => setConfirm(true)}>
                重置
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="重置演示数据？"
        width={400}
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>取消</Button>
            <Button
              variant="danger"
              onClick={() => {
                reset()
                setConfirm(false)
                toast('演示数据已重置')
              }}
            >
              确认重置
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-stone-600">你在原型里做过的所有修改（聊天、标签、任务、配置）都会被清除。</p>
      </Modal>
    </>
  )
}
