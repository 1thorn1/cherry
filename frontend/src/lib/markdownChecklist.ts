// GFM 체크리스트("- [ ] ...", "1. [x] ...") 줄만 찾는다. index는 문서에 나오는 순서(0부터)로,
// react-markdown이 input 컴포넌트를 호출하는 순서와 일치한다(둘 다 원문을 위에서 아래로 훑는다).
const CHECKBOX_LINE = /^([ \t]*(?:[-*+]|\d{1,9}[.)])[ \t]+)\[([ xX])\](?=[ \t]|$)/gm

export function toggleMarkdownCheckbox(source: string, index: number): string {
  CHECKBOX_LINE.lastIndex = 0
  let count = -1
  let match: RegExpExecArray | null
  while ((match = CHECKBOX_LINE.exec(source))) {
    count += 1
    if (count === index) {
      const checked = match[2].trim() !== ''
      const flipped = checked ? ' ' : 'x'
      const replaced = `${match[1]}[${flipped}]`
      return source.slice(0, match.index) + replaced + source.slice(match.index + match[0].length)
    }
  }
  return source
}
