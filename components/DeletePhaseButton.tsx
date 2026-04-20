'use client'

type DeletePhaseButtonProps = {
  action: () => void | Promise<void>
}

export default function DeletePhaseButton({ action }: DeletePhaseButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm('この工程を削除します。工程に紐づくタスクは残りますが、通常画面ではこの工程は表示されなくなります。')) {
          event.preventDefault()
        }
      }}
    >
      <button type="submit" className="btn text-xs text-red-600 hover:bg-red-50 hover:text-red-700">
        削除
      </button>
    </form>
  )
}
