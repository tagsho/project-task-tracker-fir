'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

type TaskProgressAction = (formData: FormData) => void | Promise<void>

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="text-xs text-indigo-600 hover:underline disabled:opacity-40"
    >
      {pending ? '保存中' : '保存'}
    </button>
  )
}

export default function TaskProgressForm({
  action,
  currentProgress,
  currentStatus,
  showStatus = false,
}: {
  action: TaskProgressAction
  currentProgress: number
  currentStatus: string
  showStatus?: boolean
}) {
  const [progress, setProgress] = useState(currentProgress)
  const [status, setStatus] = useState(currentStatus)

  const unchanged = progress === currentProgress && status === currentStatus

  return (
    <form action={action} className="flex items-center gap-1.5">
      {showStatus && (
        <select
          name="status"
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
      {!showStatus && <input type="hidden" name="status" value={status} />}
      <input
        name="progress"
        type="number"
        min={0}
        max={100}
        value={progress}
        onChange={event => setProgress(Number(event.target.value))}
        className="w-12 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center"
      />
      <span className="text-xs text-gray-400">%</span>
      <SubmitButton disabled={unchanged} />
    </form>
  )
}
