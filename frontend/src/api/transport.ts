export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function rawRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new ApiError(error.message || error.detail || `요청에 실패했습니다 (${res.status})`, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
