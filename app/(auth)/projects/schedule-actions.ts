'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  makePhaseGroupKey,
  parseScheduleRowsFromFile,
  type ImportedScheduleRow,
} from '@/lib/project-schedule-transfer'

export type ScheduleImportState = {
  error?: string
  success?: string
}

export const initialScheduleImportState: ScheduleImportState = {}

async function requireProjectAdmin(projectId: number) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect(`/projects/${projectId}`)

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (!project) redirect('/projects')

  return { supabase, project }
}

function getPhasePayload(row: ImportedScheduleRow, now: string) {
  return {
    name: row.phaseName,
    start_date: row.phaseStartDate,
    end_date: row.phaseEndDate,
    progress: row.phaseProgress,
    status: row.phaseStatus,
    note: row.phaseNote,
    sort_order: row.phaseSortOrder,
    updated_at: now,
  }
}

function getTaskPayload(row: ImportedScheduleRow, assigneeId: string | null, now: string) {
  return {
    name: row.taskName,
    description: row.taskDescription,
    assignee_id: assigneeId,
    start_date: row.taskStartDate,
    end_date: row.taskEndDate,
    progress: row.taskProgress,
    status: row.taskStatus,
    priority: row.taskPriority,
    note: row.taskNote,
    updated_at: now,
  }
}

export async function importProjectSchedule(
  projectId: number,
  _prevState: ScheduleImportState,
  formData: FormData
): Promise<ScheduleImportState> {
  try {
    const { supabase } = await requireProjectAdmin(projectId)
    const file = formData.get('file')

    if (!(file instanceof File) || file.size === 0) {
      return { error: 'CSV または Excel ファイルを選択してください' }
    }

    const importedRows = parseScheduleRowsFromFile(file.name, new Uint8Array(await file.arrayBuffer()))

    if (!importedRows.length) {
      return { error: '取り込めるデータがありませんでした' }
    }

    if (importedRows.some(row => row.projectId && row.projectId !== projectId)) {
      return { error: '別案件の工程表が混ざっています' }
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, login_id')
      .eq('is_active', true)

    if (usersError) throw new Error(usersError.message)

    const userIdByLogin = new Map((users ?? []).map(user => [user.login_id, user.id]))

    const { data: phases, error: phasesError } = await supabase
      .from('phases')
      .select('id, project_id')
      .eq('project_id', projectId)
      .is('deleted_at', null)

    if (phasesError) throw new Error(phasesError.message)

    const existingPhaseIds = new Set((phases ?? []).map(phase => Number(phase.id)))
    const phaseIds = Array.from(existingPhaseIds)
    const existingTaskById = new Map<number, { phase_id: number }>()

    if (phaseIds.length) {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, phase_id')
        .in('phase_id', phaseIds)
        .is('deleted_at', null)

      if (tasksError) throw new Error(tasksError.message)

      for (const task of tasks ?? []) {
        existingTaskById.set(Number(task.id), { phase_id: Number(task.phase_id) })
      }
    }

    const phaseCache = new Map<string, number>()
    let createdPhaseCount = 0
    let updatedPhaseCount = 0
    let createdTaskCount = 0
    let updatedTaskCount = 0

    for (const row of importedRows) {
      const now = new Date().toISOString()
      let resolvedPhaseId: number

      if (row.phaseId) {
        if (!existingPhaseIds.has(row.phaseId)) {
          return { error: `${row.rowNumber}行目: phase_id ${row.phaseId} はこの案件に存在しません` }
        }

        resolvedPhaseId = row.phaseId

        if (!phaseCache.has(`id:${row.phaseId}`)) {
          const { error } = await supabase
            .from('phases')
            .update(getPhasePayload(row, now))
            .eq('id', row.phaseId)
            .eq('project_id', projectId)
            .is('deleted_at', null)

          if (error) throw new Error(`${row.rowNumber}行目: ${error.message}`)
          phaseCache.set(`id:${row.phaseId}`, row.phaseId)
          updatedPhaseCount += 1
        }
      } else {
        const phaseKey = makePhaseGroupKey(row)
        const cachedPhaseId = phaseCache.get(phaseKey)

        if (cachedPhaseId) {
          resolvedPhaseId = cachedPhaseId
        } else {
          const { data, error } = await supabase
            .from('phases')
            .insert({ ...getPhasePayload(row, now), project_id: projectId, created_at: now })
            .select('id')
            .single()

          if (error || !data) throw new Error(`${row.rowNumber}行目: ${error?.message ?? '工程を作成できませんでした'}`)

          resolvedPhaseId = Number(data.id)
          phaseCache.set(phaseKey, resolvedPhaseId)
          createdPhaseCount += 1
        }
      }

      if (!row.taskName) {
        continue
      }

      let assigneeId: string | null = null

      if (row.taskAssigneeLoginId) {
        assigneeId = userIdByLogin.get(row.taskAssigneeLoginId) ?? null
        if (!assigneeId) {
          return { error: `${row.rowNumber}行目: 担当者 ${row.taskAssigneeLoginId} が見つかりません` }
        }
      }

      if (row.taskId) {
        if (!existingTaskById.has(row.taskId)) {
          return { error: `${row.rowNumber}行目: task_id ${row.taskId} はこの案件に存在しません` }
        }

        const { error } = await supabase
          .from('tasks')
          .update({ ...getTaskPayload(row, assigneeId, now), phase_id: resolvedPhaseId })
          .eq('id', row.taskId)
          .is('deleted_at', null)

        if (error) throw new Error(`${row.rowNumber}行目: ${error.message}`)
        updatedTaskCount += 1
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert({ ...getTaskPayload(row, assigneeId, now), phase_id: resolvedPhaseId, created_at: now })

        if (error) throw new Error(`${row.rowNumber}行目: ${error.message}`)
        createdTaskCount += 1
      }
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/schedule')
    revalidatePath('/gantt')
    revalidatePath('/tasks')

    return {
      success:
        `取り込み完了: 工程 ${createdPhaseCount}件追加 / ${updatedPhaseCount}件更新、` +
        `タスク ${createdTaskCount}件追加 / ${updatedTaskCount}件更新`,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '取り込みに失敗しました',
    }
  }
}
