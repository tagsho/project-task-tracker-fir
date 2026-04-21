'use client'

import { useFormState, useFormStatus } from 'react-dom'
import {
  importProjectSchedule,
  initialScheduleImportState,
} from '@/app/(auth)/projects/schedule-actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" className="btn text-xs" disabled={pending}>
      {pending ? '取込中' : 'インポート'}
    </button>
  )
}

export default function ScheduleImportForm({ projectId }: { projectId: number }) {
  const action = importProjectSchedule.bind(null, projectId)
  const [state, formAction] = useFormState(action, initialScheduleImportState)

  return (
    <form action={formAction} className="flex items-center gap-2" encType="multipart/form-data">
      <input
        type="file"
        name="file"
        accept=".csv,.xlsx,.xls"
        className="block w-52 text-xs text-gray-500 file:mr-2 file:rounded file:border file:border-gray-200 file:bg-white file:px-2 file:py-1 file:text-xs file:text-gray-600"
        required
      />
      <SubmitButton />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-green-600">{state.success}</p>}
    </form>
  )
}
