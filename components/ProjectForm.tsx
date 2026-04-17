import Link from 'next/link'
import type { Project, User } from '@/types'

type ProjectAction = (formData: FormData) => void | Promise<void>

export default function ProjectForm({
  project,
  users,
  currentUserId,
  action,
}: {
  project?: Project
  users: User[]
  currentUserId: string
  action: ProjectAction
}) {
  const isEdit = !!project

  return (
    <form action={action} className="space-y-4 max-w-lg">
      <div>
        <label className="label" htmlFor="project-name">案件名 *</label>
        <input
          id="project-name"
          name="name"
          className="input"
          defaultValue={project?.name ?? ''}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="project-description">概要</label>
        <textarea
          id="project-description"
          name="description"
          className="input min-h-20"
          defaultValue={project?.description ?? ''}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="project-start-date">開始日</label>
          <input
            id="project-start-date"
            name="start_date"
            type="date"
            className="input"
            defaultValue={project?.start_date ?? ''}
          />
        </div>
        <div>
          <label className="label" htmlFor="project-end-date">終了予定日</label>
          <input
            id="project-end-date"
            name="end_date"
            type="date"
            className="input"
            defaultValue={project?.end_date ?? ''}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="project-status">ステータス</label>
          <select
            id="project-status"
            name="status"
            className="input"
            defaultValue={project?.status ?? 'pending'}
          >
            <option value="pending">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="completed">完了</option>
            <option value="on_hold">保留</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="project-owner">責任者</label>
          <select
            id="project-owner"
            name="owner_id"
            className="input"
            defaultValue={project?.owner_id ?? currentUserId}
          >
            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="project-note">備考</label>
        <textarea
          id="project-note"
          name="note"
          className="input"
          defaultValue={project?.note ?? ''}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary">
          {isEdit ? '更新' : '作成'}
        </button>
        <Link href={isEdit ? `/projects/${project.id}` : '/projects'} className="btn">
          キャンセル
        </Link>
      </div>
    </form>
  )
}
