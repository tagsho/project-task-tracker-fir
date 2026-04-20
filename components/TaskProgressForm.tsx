'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function TaskProgressForm({
  taskId,
  currentProgress,
  currentStatus,
  showStatus = false,
}: {
  taskId: number
  currentProgress: number
  currentStatus: string
  showStatus?: boolean
}) {
  const [progress, setProgress] = useState(currentProgress)
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('tasks')
      .update({ progress, status, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    setSaving(false)
    router.refresh()
  }

  const unchanged = progress === currentProgress && status === currentStatus

  return (
    <div className="flex items-center gap-1.5">
      {showStatus && (
        <select
          value={status}
          onChange={event => setStatus(event.target.value)}
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white"
        >
          <option value="not_started">未着手</option>
          <option value="in_progress">進行中</option>
          <option value="completed">完了</option>
          <option value="on_hold">保留</option>
        </select>
      )}
      <input
        type="number"
        min={0}
        max={100}
        value={progress}
        onChange={e => setProgress(Number(e.target.value))}
        className="w-12 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center"
      />
      <span className="text-xs text-gray-400">%</span>
      <button
        onClick={handleSave}
        disabled={saving || unchanged}
        className="text-xs text-indigo-600 hover:underline disabled:opacity-40"
      >
        {saving ? '保存中' : '保存'}
      </button>
    </div>
  )
}
