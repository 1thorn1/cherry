import { useEffect, useState } from 'react'

export default function App() {
  const [status, setStatus] = useState('확인 중...')

  useEffect(() => {
    fetch('/api/today')
      .then((res) => res.json())
      .then((data) => setStatus(`연결됨 — 할 일 ${data.todo.length}개`))
      .catch(() => setStatus('연결 실패'))
  }, [])

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>체리</h1>
      <p>{status}</p>
    </div>
  )
}
