import Link from 'next/link'
import type { Task, User } from '@/types'

type TaskAction = (formData: FormData) => void | Promise<void>

type TaskFormProps = {
  projectId: number
  phaseId: number
  task?: Task
  users: User[]
  action: TaskAction
}

export default function TaskForm({ projectId, phaseId, task, users, action }: TaskFormProps) {
  const isEdit = !!task

  return (
    <form action={action} className="space-y-4 max-w-lg">
      <div>
        <label className="label" htmlFor="task-name">タスク名 *</label>
        <input
          id="task-name"
          name="name"
          className="input"
          defaultValue={task?.name ?? ''}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="task-description">概要</label>
        <textarea
          id="task-description"
          name="description"
          className="input min-h-20"
          defaultValue={task?.description ?? ''}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="task-start-date">開始日</label>
          <input
            id="task-start-date"
            name="start_date"
            type="date"
            className="input"
            defaultValue={task?.start_date ?? ''}
          />
        </div>
        <div>
          <label className="label" htmlFor="task-end-date">終了予定日</label>
          <input
            id="task-end-date"
            name="end_date"
            type="date"
            className="input"
            defaultValue={task?.end_date ?? ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="task-status">ステータス</label>
          <select
            id="task-status"
            name="status"
            className="input"
            defaultValue={task?.status ?? 'not_started'}
          >
            <option value="not_started">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="completed">完了</option>
            <option value="on_hold">保留</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="task-priority">優先度</label>
          <select
            id="task-priority"
            name="priority"
            className="input"
            defaultValue={task?.priority ?? 'medium'}
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="task-assignee">担当者</label>
          <select
            id="task-assignee"
            name="assignee_id"
            className="input"
            defaultValue={task?.assignee_id ?? ''}
          >
            <option value="">未設定</option>
            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="task-progress">進捗率</label>
          <input
            id="task-progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            className="input"
            defaultValue={task?.progress ?? 0}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="task-note">備考</label>
        <textarea
          id="task-note"
          name="note"
          className="input"
          defaultValue={task?.note ?? ''}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary">
          {isEdit ? '更新' : '作成'}
        </button>
        <Link href={`/projects/${projectId}`} className="btn">
          キャンセル
        </Link>
      </div>
    </form>
  )
}
