'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function TaskProgressForm({
  taskId,
  currentProgress,
  currentStatus,
}: {
  taskId: number
  currentProgress: number
  currentStatus: string
}) {
  const [progress, setProgress] = useState(currentProgress)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('tasks')
      .update({ progress, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1.5">
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
        disabled={saving || progress === currentProgress}
        className="text-xs text-indigo-600 hover:underline disabled:opacity-40"
      >
        {saving ? '保存中' : '保存'}
      </button>
    </div>
  )
}
