import { ApiError, rawRequest } from './transport.ts'
import { cacheResponse, forgetOwner, pendingChanges, projectCached, queueCompletion, readCached, rememberIdentity, resolveOwner } from '../lib/offlineCompletion.ts'
import type { AuthUser } from '../types/auth.ts'

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const completion = url.match(/^\/api\/(tasks|milestones)\/(\d+)\/(complete|uncomplete)$/)
  if (completion && options?.method === 'PATCH') {
    return await queueCompletion(completion[1] === 'tasks' ? 'task' : 'milestone', Number(completion[2]), completion[3] === 'complete') as T
  }
  let userId = await resolveOwner()
  const readOnly = !options?.method || options.method === 'GET'
  if (!navigator.onLine) {
    if (readOnly && userId) {
      const cached = await readCached<T>(userId, url)
      if (cached !== undefined) return cached
    }
    throw new Error(readOnly ? '오프라인에서는 이전에 불러온 내용만 볼 수 있어요.' : '오프라인에서는 완료·취소만 저장할 수 있어요. 연결 후 다시 시도해주세요.')
  }
  try {
    const data = await rawRequest<T>(url, options)
    if (url === '/api/auth/me') {
      userId = (data as AuthUser).id
      await rememberIdentity(data as AuthUser)
    }
    if (url === '/api/auth/logout') await forgetOwner()
    if (readOnly && userId) {
      await cacheResponse(userId, url, data).catch(() => {})
      return projectCached(url, data, await pendingChanges(userId).catch(() => [])) as T
    }
    return data
  } catch (e) {
    if (readOnly && userId && !(e instanceof ApiError)) {
      const cached = await readCached<T>(userId, url)
      if (cached !== undefined) return cached
      throw new Error('오프라인에서는 이전에 불러온 내용만 볼 수 있어요.', { cause: e })
    }
    if (!readOnly && !(e instanceof ApiError)) throw new Error('오프라인에서는 완료·취소만 저장할 수 있어요. 연결 후 다시 시도해주세요.', { cause: e })
    throw e
  }
}
