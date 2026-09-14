import { useEffect, useState } from 'react'
import type { Task } from './types/task'
import { getToday, createTask, completeTask, uncompleteTask, deleteTask } from './api/tasks'

const today = new Date().toISOString().slice(0, 10)

export default function App() {
  const [todo, setTodo] = useState<Task[]>([])
  const [done, setDone] = useState<Task[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'todo' | 'done'>('todo')
  const [saving, setSaving] = useState(false)

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

  useEffect(() => { load() }, [])

  async function handleAdd() {
    const title = input.trim()
    if (!title || saving) return
    setSaving(true)
    try {
      await createTask(title, today)
      setInput('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가하지 못했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(task: Task) {
    task.completed_at ? await uncompleteTask(task.id) : await completeTask(task.id)
    load()
  }

  async function handleDelete(id: number) {
    await deleteTask(id)
    load()
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">

        <header className="mb-6">
          <h1 className="text-xl font-medium tracking-tight">체리</h1>
          <p className="mt-1 text-xs text-neutral-500">{today}</p>
        </header>

        <div className="mb-6 flex gap-2">
          <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return
                if (e.key === 'Enter') handleAdd()
              }}
              placeholder="할 일 적기"
              className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
          <button
              onClick={handleAdd}
              disabled={saving}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--cherry)' }}
          >
            추가
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
        )}

        <div className="mb-4 flex gap-1 rounded-lg bg-neutral-100 p-1 lg:hidden">
          <button
            onClick={() => setTab('todo')}
            className={`flex-1 rounded-md py-2 text-xs font-medium ${tab === 'todo' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
          >
            할 일 {todo.length}
          </button>
          <button
            onClick={() => setTab('done')}
            className={`flex-1 rounded-md py-2 text-xs font-medium ${tab === 'done' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
          >
            완료 {done.length}
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">

          <section className={tab === 'todo' ? '' : 'hidden lg:block'}>
            <p className="mb-3 hidden text-xs text-neutral-500 lg:block">할 일 {todo.length}</p>
            {todo.length === 0 && (
              <p className="py-8 text-center text-xs text-neutral-400">할 일이 없어요</p>
            )}
            {todo.map((task) => (
              <div key={task.id} className="group flex items-center gap-3 border-b border-neutral-100 py-3">
                <button
                  onClick={() => handleToggle(task)}
                  className="h-4 w-4 flex-none rounded border-[1.5px] border-neutral-300 hover:border-neutral-500"
                  aria-label="완료"
                />
                <span className="flex-1 text-sm">{task.title}</span>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-xs text-neutral-300 opacity-0 transition group-hover:opacity-100"
                >
                  삭제
                </button>
              </div>
            ))}
          </section>

          <section className={tab === 'done' ? '' : 'hidden lg:block'}>
            <p className="mb-3 hidden text-xs text-neutral-500 lg:block">완료 {done.length}</p>
            {done.length === 0 && (
              <p className="py-8 text-center text-xs text-neutral-400">아직 없어요</p>
            )}
            {done.map((task) => (
              <div key={task.id} className="flex items-center gap-3 border-b border-neutral-100 py-3">
                <button
                  onClick={() => handleToggle(task)}
                  className="flex h-4 w-4 flex-none items-center justify-center rounded text-[10px] text-white"
                  style={{ background: 'var(--cherry)' }}
                  aria-label="완료 취소"
                >
                  ✓
                </button>
                <span className="flex-1 text-sm text-neutral-400 line-through">{task.title}</span>
                <span className="text-[11px] text-neutral-300">{task.completed_at?.slice(11, 16)}</span>
              </div>
            ))}
          </section>

        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-neutral-100 bg-white lg:hidden">
        <div className="flex-1 py-3 text-center text-[11px]" style={{ color: 'var(--cherry)' }}>오늘</div>
        <div className="flex-1 py-3 text-center text-[11px] text-neutral-400">캘린더</div>
        <div className="flex-1 py-3 text-center text-[11px] text-neutral-400">프로젝트</div>
        <div className="flex-1 py-3 text-center text-[11px] text-neutral-400">공원</div>
      </nav>
    </div>
  )
}
