import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { SearchResult } from '../types/search'
import { search } from '../api/search'

const typeLabels: Record<string, string> = {
  TASK: '할 일',
  NOTE: '메모',
  LINK: '링크',
  RETRO: '회고',
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch() {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setSearched(false)
      return
    }
    try {
      setResults(await search(trimmed))
      setSearched(true)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '검색하지 못했습니다')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <h1 className="mb-6 text-xl font-medium tracking-tight">검색</h1>

      <div className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            if (e.key === 'Enter') handleSearch()
          }}
          placeholder="할 일, 메모, 링크 검색"
          className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
        />
        <button
          onClick={handleSearch}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white"
          style={{ background: 'var(--cherry)' }}
        >
          검색
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      {searched && results.length === 0 && (
        <p className="py-8 text-center text-xs text-neutral-400">결과가 없어요</p>
      )}

      {results.map((result) => (
        <div key={`${result.type}-${result.ref_id}`} className="border-b border-neutral-100 py-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
              {typeLabels[result.type] ?? result.type}
            </span>
            {result.project_name && result.project_id && (
              <Link to={`/projects/${result.project_id}`} className="text-[11px] text-neutral-400">
                {result.project_name}
              </Link>
            )}
          </div>
          <p className="text-sm">{result.text}</p>
        </div>
      ))}
    </div>
  )
}
