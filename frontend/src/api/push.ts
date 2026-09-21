import { request } from './client'

export function getPublicKey() {
  return request<{ public_key: string }>('/api/push/public-key')
}

export function subscribe(subscription: PushSubscriptionJSON) {
  return request<void>('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  })
}
