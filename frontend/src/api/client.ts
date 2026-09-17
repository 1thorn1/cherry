export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '요청에 실패했습니다' }))
    throw new Error(error.message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
