import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      // 개발 중엔 꺼둔다 — 서비스워커가 예전 번들을 캐시해서 물고 있으면 코드를 고쳐도
      // 새로고침만으로는 반영이 안 되고(진짜 버그처럼 보임), 매번 SW를 지워야 확인 가능했다.
      // 푸시 알림을 로컬에서 직접 테스트해야 할 때만 잠깐 true로 켜고 다시 꺼둘 것.
      devOptions: { enabled: false, type: 'module' },
      manifest: {
        name: '체리 — 체크하며 리마인드',
        short_name: '체리',
        description: '오늘 할 일을 체크하면 내 공원이 지어지는 생산성 앱',
        lang: 'ko',
        theme_color: '#D4537E',
        background_color: '#FBEAF0',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
