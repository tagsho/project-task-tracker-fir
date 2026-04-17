'use client'

export default function DeleteProjectButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm('この案件を削除します。関連する工程・タスクは残りますが、通常画面ではこの案件は表示されなくなります。')) {
          event.preventDefault()
        }
      }}
    >
      <button type="submit" className="btn text-red-600 hover:bg-red-50 hover:text-red-700">
        削除
      </button>
    </form>
  )
}
