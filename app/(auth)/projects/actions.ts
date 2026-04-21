'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ProjectStatus } from '@/types'

const PROJECT_STATUSES: ProjectStatus[] = ['pending', 'in_progress', 'completed', 'on_hold']

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text || null
}

function getProjectPayload(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const status = String(formData.get('status') ?? 'pending') as ProjectStatus
  const ownerId = String(formData.get('owner_id') ?? '').trim()

  if (!name) throw new Error('案件名を入力してください')
  if (!PROJECT_STATUSES.includes(status)) throw new Error('ステータスが不正です')
  if (!ownerId) throw new Error('責任者を選択してください')

  return {
    name,
    description: nullableText(formData.get('description')),
    start_date: nullableText(formData.get('start_date')),
    end_date: nullableText(formData.get('end_date')),
    status,
    owner_id: ownerId,
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

export async function createProject(formData: FormData) {
  const supabase = await requireAdmin()
  const payload = getProjectPayload(formData)

  const { error } = await supabase
    .from('projects')
    .insert({ ...payload, created_at: new Date().toISOString() })

  if (error) throw new Error(error.message)

  revalidatePath('/projects')
  redirect('/projects')
}

export async function updateProject(projectId: number, formData: FormData) {
  const supabase = await requireAdmin()
  const payload = getProjectPayload(formData)

  const { error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function updateProjectStatus(projectId: number, formData: FormData) {
  const supabase = await requireAdmin()
  const status = String(formData.get('status') ?? '') as ProjectStatus

  if (!PROJECT_STATUSES.includes(status)) {
    throw new Error('ステータスが不正です')
  }

  const { error } = await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
}

export async function deleteProject(projectId: number) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  revalidatePath('/projects')
  redirect('/projects')
}
