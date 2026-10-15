/// <reference lib="webworker" />
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
// 조회 캐시는 앱에서 계정별로 관리한다. SW는 오프라인에서도 앱 화면만 열어준다.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), {
  denylist: [/^\/api\//, /^\/oauth2\//, /^\/login\//],
}))

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title ?? '체리'
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow('/'))
})
