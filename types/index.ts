export type Role = 'admin' | 'member'
export type ProjectStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold'
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold'
export type Priority = 'high' | 'medium' | 'low'
export type EntityType = 'project' | 'phase' | 'task'

export interface User {
  id: string
  name: string
  login_id: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  owner_id: string
  note: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  owner?: User
  phases?: Phase[]
  auto_progress?: number
}

export interface Phase {
  id: number
  project_id: number
  name: string
  start_date: string | null
  end_date: string | null
  progress: number
  status: ProjectStatus
  note: string | null
  sort_order: number
  deleted_at: string | null
  created_at: string
  updated_at: string
  tasks?: Task[]
}

export interface Task {
  id: number
  phase_id: number
  name: string
  description: string | null
  assignee_id: string | null
  start_date: string | null
  end_date: string | null
  progress: number
  status: TaskStatus
  priority: Priority
  note: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  assignee?: User
  is_overdue?: boolean
}

export interface Comment {
  id: number
  entity_type: EntityType
  entity_id: number
  user_id: string
  body: string
  deleted_at: string | null
  created_at: string
  updated_at: string
  user?: User
}

// ステータス・優先度の日本語ラベル
export const STATUS_LABEL: Record<ProjectStatus | TaskStatus, string> = {
  pending:      '未着手',
  in_progress:  '進行中',
  completed:    '完了',
  on_hold:      '保留',
  not_started:  '未着手',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  high:   '高',
  medium: '中',
  low:    '低',
}

export const STATUS_COLOR: Record<ProjectStatus | TaskStatus, string> = {
  pending:     'bg-gray-100 text-gray-600',
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  on_hold:     'bg-yellow-100 text-yellow-700',
}

export const PRIORITY_COLOR: Record<Priority, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-600',
}
