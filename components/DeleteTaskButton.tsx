'use client'

type DeleteTaskButtonProps = {
  action: () => void | Promise<void>
}

export default function DeleteTaskButton({ action }: DeleteTaskButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm('このタスクを削除します。通常画面ではこのタスクは表示されなくなります。')) {
          event.preventDefault()
        }
      }}
    >
      <button type="submit" className="text-xs text-red-600 hover:underline">
        削除
      </button>
    </form>
  )
}
