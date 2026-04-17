type LogContext = Record<string, string | number | boolean | null | undefined>

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
    stack: undefined,
  }
}

export function logRouteError(route: string, error: unknown, context: LogContext = {}) {
  const details = getErrorDetails(error)

  console.error('[server-route-error]', {
    route,
    ...context,
    ...details,
  })
}
