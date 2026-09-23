import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { SearchResult } from '../types/search'
import { search } from '../api/search'

const typeLabels: Record<string, string> = {
  TASK: '할 일',
  NOTE: '메모',
  LINK: '링크',
  RETRO: '회고',
}

const TYPE_ORDER = ['TASK', 'NOTE', 'LINK', 'RETRO'] as const

function highlightMatch(text: string, query: string) {
  const trimmed = query.trim()
  if (!trimmed) return text
  const idx = text.toLowerCase().indexOf(trimmed.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}>
        {text.slice(idx, idx + trimmed.length)}
      </mark>
      {text.slice(idx + trimmed.length)}
    </>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeType, setActiveType] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function runSearch(q: string) {
    try {
      setResults(await search(q))
      setActiveType(null)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '검색하지 못했습니다')
    }
  }

  // 검색어가 없을 때는 최근 기록을 기본으로 보여준다 (A-6-5).
  useEffect(() => { runSearch('') }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    if (value.trim() === '') runSearch('')
  }

  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1
    return acc
  }, {})
  const visibleResults = activeType ? results.filter((r) => r.type === activeType) : results

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <h1 className="mb-6 text-xl font-medium tracking-tight">검색</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            if (e.key === 'Enter') runSearch(query.trim())
          }}
          placeholder="할 일, 메모, 링크, 회고 검색"
          className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
        />
        <button
          onClick={() => runSearch(query.trim())}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white"
          style={{ background: 'var(--cherry)' }}
        >
          검색
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      {results.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveType(null)}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={activeType === null
              ? { background: 'var(--cherry)', color: 'white' }
              : { background: '#F5F5F4', color: '#a3a3a3' }}
          >
            전체 {results.length}
          </button>
          {TYPE_ORDER.filter((t) => counts[t] > 0).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={activeType === t
                ? { background: 'var(--cherry)', color: 'white' }
                : { background: '#F5F5F4', color: '#a3a3a3' }}
            >
              {typeLabels[t]} {counts[t]}
            </button>
          ))}
        </div>
      )}

      {results.length === 0 && (
        <p className="py-8 text-center text-xs text-neutral-400">
          {query.trim() ? '결과가 없어요' : '아직 기록이 없어요'}
        </p>
      )}

      {visibleResults.map((result) => (
        <div key={`${result.type}-${result.ref_id}`} className="border-b border-neutral-100 py-3">
          <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
              {typeLabels[result.type] ?? result.type}
            </span>
            {result.project_name && (
              <>
                <span>·</span>
                {result.project_id ? (
                  <Link to={`/projects/${result.project_id}`} className="hover:underline">
                    {result.project_name}
                  </Link>
                ) : (
                  <span>{result.project_name}</span>
                )}
              </>
            )}
            {result.milestone_title && (
              <>
                <span>·</span>
                <span>{result.milestone_title}</span>
              </>
            )}
            <span>·</span>
            <span>{result.at.slice(0, 10)}</span>
          </div>
          <p className="text-sm">{result.text && highlightMatch(result.text, query)}</p>
        </div>
      ))}
    </div>
  )
}
