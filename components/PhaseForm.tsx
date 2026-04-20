import Link from 'next/link'
import type { Phase } from '@/types'

type PhaseAction = (formData: FormData) => void | Promise<void>

type PhaseFormProps = {
  projectId: number
  phase?: Phase
  action: PhaseAction
}

export default function PhaseForm({ projectId, phase, action }: PhaseFormProps) {
  const isEdit = !!phase

  return (
    <form action={action} className="space-y-4 max-w-lg">
      <div>
        <label className="label" htmlFor="phase-name">工程名 *</label>
        <input
          id="phase-name"
          name="name"
          className="input"
          defaultValue={phase?.name ?? ''}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="phase-start-date">開始日</label>
          <input
            id="phase-start-date"
            name="start_date"
            type="date"
            className="input"
            defaultValue={phase?.start_date ?? ''}
          />
        </div>
        <div>
          <label className="label" htmlFor="phase-end-date">終了予定日</label>
          <input
            id="phase-end-date"
            name="end_date"
            type="date"
            className="input"
            defaultValue={phase?.end_date ?? ''}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="phase-status">ステータス</label>
          <select
            id="phase-status"
            name="status"
            className="input"
            defaultValue={phase?.status ?? 'pending'}
          >
            <option value="pending">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="completed">完了</option>
            <option value="on_hold">保留</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="phase-progress">進捗率</label>
          <input
            id="phase-progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            className="input"
            defaultValue={phase?.progress ?? 0}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="phase-sort-order">並び順</label>
        <input
          id="phase-sort-order"
          name="sort_order"
          type="number"
          min={0}
          className="input"
          defaultValue={phase?.sort_order ?? 0}
        />
      </div>

      <div>
        <label className="label" htmlFor="phase-note">備考</label>
        <textarea
          id="phase-note"
          name="note"
          className="input"
          defaultValue={phase?.note ?? ''}
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
