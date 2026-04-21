import type { Priority, ProjectStatus, TaskStatus } from '@/types'
import * as XLSX from 'xlsx'

const PROJECT_STATUSES: ProjectStatus[] = ['pending', 'in_progress', 'completed', 'on_hold']
const TASK_STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'completed', 'on_hold']
const PRIORITIES: Priority[] = ['high', 'medium', 'low']

export type ScheduleExportRow = {
  project_id: number
  project_name: string
  phase_id: number | null
  phase_sort_order: number
  phase_name: string
  phase_status: ProjectStatus
  phase_progress: number
  phase_start_date: string
  phase_end_date: string
  phase_note: string
  task_id: number | null
  task_name: string
  task_status: TaskStatus | ''
  task_progress: number | ''
  task_priority: Priority | ''
  task_assignee_login_id: string
  task_assignee_name: string
  task_start_date: string
  task_end_date: string
  task_description: string
  task_note: string
}

export type ImportedScheduleRow = {
  rowNumber: number
  projectId: number | null
  phaseId: number | null
  phaseSortOrder: number
  phaseName: string
  phaseStatus: ProjectStatus
  phaseProgress: number
  phaseStartDate: string | null
  phaseEndDate: string | null
  phaseNote: string | null
  taskId: number | null
  taskName: string | null
  taskStatus: TaskStatus
  taskProgress: number
  taskPriority: Priority
  taskAssigneeLoginId: string | null
  taskStartDate: string | null
  taskEndDate: string | null
  taskDescription: string | null
  taskNote: string | null
}

export const SCHEDULE_COLUMNS: (keyof ScheduleExportRow)[] = [
  'project_id',
  'project_name',
  'phase_id',
  'phase_sort_order',
  'phase_name',
  'phase_status',
  'phase_progress',
  'phase_start_date',
  'phase_end_date',
  'phase_note',
  'task_id',
  'task_name',
  'task_status',
  'task_progress',
  'task_priority',
  'task_assignee_login_id',
  'task_assignee_name',
  'task_start_date',
  'task_end_date',
  'task_description',
  'task_note',
]

function textValue(value: unknown) {
  return String(value ?? '').trim()
}

function nullableText(value: unknown) {
  const text = textValue(value)
  return text || null
}

function numericValue(value: unknown, fallback: number, min: number, max: number) {
  const raw = textValue(value)
  const number = Number(raw || fallback)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

function optionalId(value: unknown) {
  const raw = textValue(value)
  if (!raw) return null
  const number = Number(raw)
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`IDが不正です: ${raw}`)
  }
  return number
}

function projectStatusValue(value: unknown, fallback: ProjectStatus = 'pending') {
  const status = textValue(value) as ProjectStatus
  if (!status) return fallback
  if (!PROJECT_STATUSES.includes(status)) {
    throw new Error(`工程ステータスが不正です: ${status}`)
  }
  return status
}

function taskStatusValue(value: unknown, fallback: TaskStatus = 'not_started') {
  const status = textValue(value) as TaskStatus
  if (!status) return fallback
  if (!TASK_STATUSES.includes(status)) {
    throw new Error(`タスクステータスが不正です: ${status}`)
  }
  return status
}

function priorityValue(value: unknown, fallback: Priority = 'medium') {
  const priority = textValue(value) as Priority
  if (!priority) return fallback
  if (!PRIORITIES.includes(priority)) {
    throw new Error(`優先度が不正です: ${priority}`)
  }
  return priority
}

function normalizeDate(value: unknown) {
  const text = textValue(value)
  return text || ''
}

export function buildScheduleExportRows(project: any): ScheduleExportRow[] {
  const phases = ((project.phases as any[]) ?? [])
    .filter((phase: any) => !phase.deleted_at)
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return phases.reduce<ScheduleExportRow[]>((rows, phase: any) => {
    const base = {
      project_id: Number(project.id),
      project_name: project.name,
      phase_id: Number(phase.id),
      phase_sort_order: Number(phase.sort_order ?? 0),
      phase_name: phase.name,
      phase_status: phase.status as ProjectStatus,
      phase_progress: Number(phase.progress ?? 0),
      phase_start_date: normalizeDate(phase.start_date),
      phase_end_date: normalizeDate(phase.end_date),
      phase_note: textValue(phase.note),
    }

    const tasks = ((phase.tasks as any[]) ?? []).filter((task: any) => !task.deleted_at)

    if (!tasks.length) {
      rows.push({
        ...base,
        task_id: null,
        task_name: '',
        task_status: '',
        task_progress: '',
        task_priority: '',
        task_assignee_login_id: '',
        task_assignee_name: '',
        task_start_date: '',
        task_end_date: '',
        task_description: '',
        task_note: '',
      })
      return rows
    }

    for (const task of tasks) {
      rows.push({
        ...base,
        task_id: Number(task.id),
        task_name: task.name,
        task_status: task.status as TaskStatus,
        task_progress: Number(task.progress ?? 0),
        task_priority: task.priority as Priority,
        task_assignee_login_id: textValue(task.assignee?.login_id),
        task_assignee_name: textValue(task.assignee?.name),
        task_start_date: normalizeDate(task.start_date),
        task_end_date: normalizeDate(task.end_date),
        task_description: textValue(task.description),
        task_note: textValue(task.note),
      })
    }

    return rows
  }, [])
}

export function buildScheduleCsv(rows: ScheduleExportRow[]) {
  const matrix = [
    SCHEDULE_COLUMNS,
    ...rows.map(row => SCHEDULE_COLUMNS.map(column => row[column] ?? '')),
  ]
  const sheet = XLSX.utils.aoa_to_sheet(matrix)
  return XLSX.utils.sheet_to_csv(sheet)
}

export function buildScheduleWorkbook(projectName: string, rows: ScheduleExportRow[]) {
  const workbook = XLSX.utils.book_new()
  const data = [
    SCHEDULE_COLUMNS,
    ...rows.map(row => SCHEDULE_COLUMNS.map(column => row[column] ?? '')),
  ]
  const scheduleSheet = XLSX.utils.aoa_to_sheet(data)
  const noteSheet = XLSX.utils.aoa_to_sheet([
    ['sheet', 'note'],
    ['工程表', 'phase_id / task_id を残して再インポートすると更新、空欄なら新規追加します'],
    ['工程表', 'task_assignee_login_id には users.login_id を入れてください'],
    ['工程表', 'phase_name は必須です。task_name を空欄にすると工程のみ取り込みます'],
    ['工程表', `project_name: ${projectName}`],
  ])

  XLSX.utils.book_append_sheet(workbook, scheduleSheet, '工程表')
  XLSX.utils.book_append_sheet(workbook, noteSheet, '使い方')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

export function parseScheduleRowsFromFile(fileName: string, bytes: Uint8Array) {
  const lowerName = fileName.toLowerCase()
  const workbook = lowerName.endsWith('.csv')
    ? XLSX.read(new TextDecoder('utf-8').decode(bytes), { type: 'string' })
    : XLSX.read(bytes, { type: 'array' })

  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) throw new Error('シートが見つかりません')

  const sheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (!rawRows.length) throw new Error('データ行が見つかりません')

  return rawRows.map((row, index) => normalizeImportedRow(row, index))
}

function normalizeImportedRow(row: Record<string, unknown>, index: number): ImportedScheduleRow {
  try {
    const phaseName = textValue(row.phase_name)
    if (!phaseName) throw new Error('phase_name は必須です')

    const taskId = optionalId(row.task_id)
    const taskName = nullableText(row.task_name)

    if (taskId && !taskName) {
      throw new Error('task_id を使う場合は task_name も必要です')
    }

    return {
      rowNumber: index + 2,
      projectId: optionalId(row.project_id),
      phaseId: optionalId(row.phase_id),
      phaseSortOrder: numericValue(row.phase_sort_order, 0, 0, 9999),
      phaseName,
      phaseStatus: projectStatusValue(row.phase_status),
      phaseProgress: numericValue(row.phase_progress, 0, 0, 100),
      phaseStartDate: nullableText(row.phase_start_date),
      phaseEndDate: nullableText(row.phase_end_date),
      phaseNote: nullableText(row.phase_note),
      taskId,
      taskName,
      taskStatus: taskStatusValue(row.task_status),
      taskProgress: numericValue(row.task_progress, 0, 0, 100),
      taskPriority: priorityValue(row.task_priority),
      taskAssigneeLoginId: nullableText(row.task_assignee_login_id),
      taskStartDate: nullableText(row.task_start_date),
      taskEndDate: nullableText(row.task_end_date),
      taskDescription: nullableText(row.task_description),
      taskNote: nullableText(row.task_note),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '形式が不正です'
    throw new Error(`${index + 2}行目: ${message}`)
  }
}

export function makePhaseGroupKey(row: ImportedScheduleRow) {
  if (row.phaseId) return `id:${row.phaseId}`
  return [
    'new',
    row.phaseName,
    row.phaseSortOrder,
    row.phaseStartDate ?? '',
    row.phaseEndDate ?? '',
  ].join(':')
}

export function sanitizeDownloadName(projectId: number, extension: 'csv' | 'xlsx') {
  return `project-${projectId}-schedule.${extension}`
}
