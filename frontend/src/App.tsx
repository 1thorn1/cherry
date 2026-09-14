import { useEffect, useState } from 'react'
import type { Task } from './types/task'
import { getToday, createTask, completeTask, uncompleteTask, deleteTask } from './api/tasks'

const today = new Date().toISOString().slice(0, 10)

export default function App() {
  const [todo, setTodo] = useState<Task[]>([])
  const [done, setDone] = useState<Task[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await getToday(today)
      setTodo(data.todo)
      setDone(data.done)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd() {
    const title = input.trim()
    if (!title) return
    try {
      await createTask(title, today)
      setInput('')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가하지 못했습니다')
    }
  }

  async function handleToggle(task: Task) {
    if (task.completed_at) {
      await uncompleteTask(task.id)
    } else {
      await completeTask(task.id)
    }
    load()
  }

  async function handleDelete(id: number) {
    await deleteTask(id)
    load()
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 32, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 500 }}>체리</h1>
      <p style={{ color: '#888', fontSize: 13 }}>{today}</p>

      <div style={{ display: 'flex', gap: 8, margin: '24px 0' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="할 일 적기"
          style={{ flex: 1, padding: '8px 12px', fontSize: 14 }}
        />
        <button onClick={handleAdd} style={{ padding: '8px 16px' }}>추가</button>
      </div>

      {error && <p style={{ color: '#c33', fontSize: 13 }}>{error}</p>}

      <p style={{ fontSize: 13, color: '#888' }}>할 일 {todo.length}</p>
      {todo.map((task) => (
        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #eee' }}>
          <input type="checkbox" checked={false} onChange={() => handleToggle(task)} />
          <span style={{ flex: 1, fontSize: 14 }}>{task.title}</span>
          <button onClick={() => handleDelete(task.id)} style={{ fontSize: 12, color: '#888' }}>삭제</button>
        </div>
      ))}

      <p style={{ fontSize: 13, color: '#888', marginTop: 28 }}>완료 {done.length}</p>
      {done.map((task) => (
        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #eee' }}>
          <input type="checkbox" checked={true} onChange={() => handleToggle(task)} />
          <span style={{ flex: 1, fontSize: 14, color: '#888' }}>{task.title}</span>
          <span style={{ fontSize: 12, color: '#aaa' }}>{task.completed_at?.slice(11, 16)}</span>
        </div>
      ))}
    </div>
  )
}
