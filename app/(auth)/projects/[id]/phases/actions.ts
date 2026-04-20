'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ProjectStatus } from '@/types'

const PHASE_STATUSES: ProjectStatus[] = ['pending', 'in_progress', 'completed', 'on_hold']

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text || null
}

function boundedNumber(value: FormDataEntryValue | null, fallback: number, min: number, max: number) {
  const number = Number(value ?? fallback)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function getPhasePayload(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const status = String(formData.get('status') ?? 'pending') as ProjectStatus

  if (!name) throw new Error('工程名を入力してください')
  if (!PHASE_STATUSES.includes(status)) throw new Error('ステータスが不正です')

  return {
    name,
    start_date: nullableText(formData.get('start_date')),
    end_date: nullableText(formData.get('end_date')),
    progress: boundedNumber(formData.get('progress'), 0, 0, 100),
    status,
    note: nullableText(formData.get('note')),
    sort_order: boundedNumber(formData.get('sort_order'), 0, 0, 9999),
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

export async function createPhase(projectId: number, formData: FormData) {
  const supabase = await requireAdmin()
  const payload = getPhasePayload(formData)

  const { error } = await supabase
    .from('phases')
    .insert({ ...payload, project_id: projectId, created_at: new Date().toISOString() })

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function updatePhase(projectId: number, phaseId: number, formData: FormData) {
  const supabase = await requireAdmin()
  const payload = getPhasePayload(formData)

  const { error } = await supabase
    .from('phases')
    .update(payload)
    .eq('id', phaseId)
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function deletePhase(projectId: number, phaseId: number) {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from('phases')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', phaseId)
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (error) throw new Error(error.message)

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}
