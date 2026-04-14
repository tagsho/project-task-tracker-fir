'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Project, User } from '@/types'

export default function ProjectForm({
  project,
  users,
  currentUserId,
}: {
  project?: Project
  users: User[]
  currentUserId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!project

  const [form, setForm] = useState({
    name:        project?.name ?? '',
    description: project?.description ?? '',
    start_date:  project?.start_date ?? '',
    end_date:    project?.end_date ?? '',
    status:      project?.status ?? 'pending',
    owner_id:    project?.owner_id ?? currentUserId,
    note:        project?.note ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      start_date: form.start_date || null,
      end_date:   form.end_date   || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = isEdit
      ? await supabase.from('projects').update(payload).eq('id', project!.id)
      : await supabase.from('projects').insert({ ...payload, created_at: new Date().toISOString() })

    if (error) { setError(error.message); setSaving(false); return }

    router.push('/projects')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="label">案件名 *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div>
        <label className="label">概要</label>
        <textarea className="input min-h-20" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">開始日</label>
          <input type="date" className="input" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div>
          <label className="label">終了予定日</label>
          <input type="date" className="input" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">ステータス</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="pending">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="completed">完了</option>
            <option value="on_hold">保留</option>
          </select>
        </div>
        <div>
          <label className="label">責任者</label>
          <select className="input" value={form.owner_id} onChange={e => set('owner_id', e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">備考</label>
        <textarea className="input" value={form.note} onChange={e => set('note', e.target.value)} />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-40">
          {saving ? '保存中...' : isEdit ? '更新' : '作成'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn">キャンセル</button>
      </div>
    </form>
  )
}
