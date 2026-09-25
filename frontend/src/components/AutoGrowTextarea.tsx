import { useEffect, useRef, type TextareaHTMLAttributes } from 'react'

// 내용이 길어지면 내부 스크롤 대신 칸 자체의 높이가 늘어나게 한다. rows는 최소 높이로만
// 쓰이고, 실제 높이는 매 입력마다 scrollHeight에 맞춰 다시 계산한다.
export default function AutoGrowTextarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [rest.value])

  return <textarea ref={ref} {...rest} className={`resize-none overflow-hidden ${className ?? ''}`} />
}
