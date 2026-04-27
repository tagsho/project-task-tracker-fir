export default function ScheduleLoading() {
  const rows = Array.from({ length: 8 })

  return (
    <div className="px-6 py-5">
      <div className="mb-6 h-[60px] rounded-xl border border-gray-200 bg-white shadow-sm" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 h-6 w-56 rounded-md bg-gray-200" />
          <div className="h-4 w-36 rounded-md bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-md bg-gray-200" />
          <div className="h-9 w-24 rounded-md bg-gray-100" />
          <div className="h-9 w-24 rounded-md bg-gray-100" />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="h-9 w-16 rounded-md bg-gray-100" />
          <div className="h-9 w-9 rounded-md bg-gray-100" />
          <div className="h-9 w-9 rounded-md bg-gray-100" />
          <div className="h-9 w-48 rounded-md bg-gray-100" />
        </div>
        <div className="h-9 w-32 rounded-md bg-gray-200" />
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid min-h-[420px] grid-cols-[470px_minmax(720px,1fr)]">
          <div className="border-r border-gray-200">
            <div className="h-11 border-b border-gray-200 bg-[#fbfcff]" />
            {rows.map((_, index) => (
              <div key={index} className="grid min-h-[44px] grid-cols-[72px_minmax(0,1fr)_96px_92px] items-center gap-3 border-b border-gray-100 px-4">
                <div className="h-3 w-8 rounded bg-gray-100" />
                <div className="h-3 rounded bg-gray-100" />
                <div className="h-3 rounded bg-gray-100" />
                <div className="h-5 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
          <div className="relative overflow-hidden">
            <div className="h-11 border-b border-gray-200 bg-[#fbfcff]" />
            <div className="h-8 border-b border-gray-200 bg-white" />
            {rows.map((_, index) => (
              <div key={index} className="relative h-11 border-b border-gray-100 bg-[linear-gradient(to_right,rgba(226,232,240,0.8)_1px,transparent_1px)]" style={{ backgroundSize: '96px 44px' }}>
                <div className="absolute left-8 top-1/2 h-4 w-1/3 -translate-y-1/2 rounded-sm bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
