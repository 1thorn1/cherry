import type { ReactNode } from 'react'
import { IconCheck } from '@tabler/icons-react'
import { CoinIcon } from './Coin'

// design_system.pdf "기본 요소" — 여러 화면이 똑같이 쓰는 조각들을 한곳에 모았다.

// 페이지 머리: 경로(대시보드 / 할 일) · display-lg 제목 · 부제 · 오른쪽 주요 버튼
export function PageHeader({
  crumb,
  title,
  subtitle,
  action,
}: {
  crumb: string
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="mb-1 hidden text-[12px] text-[var(--ink-muted)] lg:block">대시보드 / {crumb}</p>
        <h1 className="font-display text-[34px] leading-[42px] text-[var(--ink)]">{title}</h1>
        {subtitle && <div className="mt-1 text-[13px] text-[var(--ink-muted)]">{subtitle}</div>}
      </div>
      {action}
    </header>
  )
}

// 주요 버튼(wood) — 한 화면에 하나
export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 flex-none items-center justify-center gap-1.5 rounded-xl bg-[var(--wood)] px-4 text-[14px] font-semibold text-[var(--on-wood)] transition-colors hover:bg-[var(--wood-deep)] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

// 보조 버튼 — surface + line 테두리
export function SecondaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 flex-none items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--ink)] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

// 세그먼트 탭 — surface-sunken 트랙 + 선택 칸 surface·shadow-pop.
// full이면 트랙을 가로로 꽉 채우고 칸을 똑같이 나눈다(할 일 목록 위 탭)
export function Segment<T extends string>({
  options,
  value,
  onChange,
  label,
  full = false,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (value: T) => void
  label: string
  full?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`${full ? 'flex w-full' : 'inline-flex'} rounded-2xl bg-[var(--surface-sunken)] p-1`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`${full ? 'flex-1' : ''} rounded-xl px-3 py-1.5 text-[13px] transition-colors ${
            value === option.value
              ? 'bg-[var(--surface)] font-semibold text-[var(--ink)] shadow-[var(--shadow-pop)]'
              : 'font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// 보상 칩 — 받기 전 "+N"(coin-soft), 받은 뒤 "✓ 받음 +N"(sprout-soft)
export function RewardChip({ amount, received = false }: { amount: number; received?: boolean }) {
  if (received) {
    return (
      <span className="inline-flex h-6 flex-none items-center gap-1 rounded-[8px] bg-[var(--sprout-soft)] px-2 text-[12px] font-medium text-[var(--ink)]">
        <IconCheck size={12} stroke={2.2} />
        받음 +{amount}
      </span>
    )
  }
  return (
    <span
      className="inline-flex h-6 flex-none items-center gap-1 rounded-[8px] bg-[var(--coin-soft)] px-2 text-[12px] font-medium tabular-nums text-[var(--coin-ink)]"
      aria-label={`체리 ${amount}개 보상`}
    >
      <CoinIcon size={13} />+{amount}
    </span>
  )
}

// 카드 — surface + line 1px + 16px 모서리
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </div>
  )
}

// 진행률 바 — sprout 채움
export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
    >
      <div className="h-full rounded-full bg-[var(--sprout)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}

// 빈 상태 — 텍스트 한 줄로 끝내지 않는다
export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-8 text-center">
      <span className="mb-1 text-[var(--ink-faint)]">{icon}</span>
      <p className="text-[14px] font-medium text-[var(--ink)]">{title}</p>
      <p className="text-[13px] text-[var(--ink-muted)]">{hint}</p>
    </div>
  )
}

// 오류 줄 — barn은 항상 문구와 함께
export function ErrorBanner({ message }: { message: string }) {
  return (
    <p role="alert" className="mb-4 rounded-xl bg-[var(--barn-soft)] px-4 py-2.5 text-[13px] text-[var(--ink)]">
      <span className="font-semibold text-[var(--barn)]">문제가 생겼어요</span> · {message}
    </p>
  )
}
