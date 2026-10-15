// 체리 재화 아이콘 — 광택 없는 평면 색으로 보상·잔액·상점에 공통 적용
export function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="inline-block flex-none align-middle"
    >
      <path d="M7 14c1-4 3-7 6-10 0 5 2 7 4 10" fill="none" stroke="#74664f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 4.5C15 1.6 19 2 21 3.5c-2.1 3-5.8 3.9-8.5 1Z" fill="#71825b" />
      <path d="M7 11.8c-3.5-1.2-6.1 1-5.5 4.6.5 3.1 2.5 5.3 5.5 5.3s5-2.2 5.5-5.3c.6-3.6-2-5.8-5.5-4.6Z" fill="#a44c48" />
      <path d="M17 11.8c-3.4-1.2-5.9 1-5.4 4.6.5 3.1 2.5 5.3 5.4 5.3s4.9-2.2 5.4-5.3c.5-3.6-2-5.8-5.4-4.6Z" fill="#91413f" />
    </svg>
  )
}

// 잔액 배지 — coin-soft 알약, 높이 32, 숫자는 천 단위 쉼표
export function BalanceBadge({ value }: { value: number | null }) {
  return (
    <span
      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold tabular-nums"
      style={{ background: 'var(--coin-soft)', color: 'var(--coin-ink)' }}
      aria-label={value === null ? '체리 잔액 불러오는 중' : `체리 ${value.toLocaleString()}개`}
    >
      <CoinIcon size={16} />
      {value === null ? '—' : value.toLocaleString()}
    </span>
  )
}
