'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Priority, TaskStatus } from '@/types'

const TASK_STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'completed', 'on_hold']
const PRIORITIES: Priority[] = ['high', 'medium', 'low']

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text || null
}

function boundedNumber(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const number = Number(value ?? fallback)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function getTaskPayload(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const status = String(formData.get('status') ?? 'not_started') as TaskStatus
  const priority = String(formData.get('priority') ?? 'medium') as Priority

  if (!name) throw new Error('タスク名を入力してください')
  if (!TASK_STATUSES.includes(status)) throw new Error('ステータスが不正です')
  if (!PRIORITIES.includes(priority)) throw new Error('優先度が不正です')

  return {
    name,
    description: nullableText(formData.get('description')),
    assignee_id: nullableText(formData.get('assignee_id')),
    start_date: nullableText(formData.get('start_date')),
    end_date: nullableText(formData.get('end_date')),
    progress: boundedNumber(formData.get('progress'), 0, 0, 100),
    status,
    priority,
    note: nullableText(formData.get('note')),
    updated_at: new Date().toISOString(),
  }
}

async function requireAdmin() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/projects')

  return supabase
}

async function requirePhaseInProject(projectId: number, phaseId: number) {
  const supabase = await requireAdmin()
  const { data: phase } = await supabase
    .from('phases')
    .select('id')
    .eq('id', phaseId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single()

  if (!phase) redirect(`/projects/${projectId}`)

  return supabase
}

export async function createTask(projectId: number, phaseId: number, formData: FormData) {
  const supabase = await requirePhaseInProject(projectId, phaseId)
  const payload = getTaskPayload(formData)

  const { error } = await supabase
    .from('tasks')
    .insert({ ...payload, phase_id: phaseId, created_at: new Date().toISOString() })

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function updateTask(projectId: number, phaseId: number, taskId: number, formData: FormData) {
  const supabase = await requirePhaseInProject(projectId, phaseId)
  const payload = getTaskPayload(formData)

  const { error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .eq('phase_id', phaseId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function deleteTask(projectId: number, phaseId: number, taskId: number) {
  const supabase = await requirePhaseInProject(projectId, phaseId)

  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('phase_id', phaseId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}
