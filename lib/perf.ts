export async function measureServerStep<T>(label: string, task: () => Promise<T>) {
  const startedAt = Date.now()
  const result = await task()
  console.info(`[perf] ${label} ${Date.now() - startedAt}ms`)
  return result
}

export function logServerSummary(label: string, meta: Record<string, unknown>) {
  console.info(`[perf] ${label} ${JSON.stringify(meta)}`)
}
