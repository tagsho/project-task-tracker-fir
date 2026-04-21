'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { TaskStatus } from '@/types'

const TASK_STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'completed', 'on_hold']

function boundedProgress(value: FormDataEntryValue | null) {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, Math.round(number)))
}

function getStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? 'not_started') as TaskStatus
  if (!TASK_STATUSES.includes(status)) {
    throw new Error('ステータスが不正です')
  }
  return status
}

export async function updateTaskListItem(taskId: number, formData: FormData) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const progress = boundedProgress(formData.get('progress'))
  const status = getStatus(formData.get('status'))

  let query = supabase
    .from('tasks')
    .update({ progress, status, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .is('deleted_at', null)

  if (profile?.role !== 'admin') {
    query = query.eq('assignee_id', user.id)
  }

  const { error } = await query

  if (error) throw new Error(error.message)

  revalidatePath('/tasks')
  revalidatePath('/schedule')
  revalidatePath('/gantt')
}
