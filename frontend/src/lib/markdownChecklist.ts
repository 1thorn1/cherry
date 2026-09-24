import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { Node, Parent } from 'unist'

interface ListItemNode extends Parent {
  type: 'listItem'
  checked?: boolean | null
}

function isListItem(node: Node): node is ListItemNode {
  return node.type === 'listItem'
}

// react-markdown이 화면에 그리는 체크박스 순서 = remark-gfm이 "checked"를 붙인 listItem을
// 문서에서 만나는 순서. 여기서도 같은 remark-gfm 파서로 mdast를 만들어 그 순서를 그대로
// 재현하므로(정규식으로 따로 줄을 세는 방식과 달리) 화면에서 몇 번째 체크박스를 눌렀는지와
// 항상 정확히 맞는다.
export function toggleMarkdownCheckbox(source: string, index: number): string {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source)

  let count = -1
  let targetOffset: number | null = null

  function walk(node: Node) {
    if (targetOffset !== null) return
    if (isListItem(node) && node.checked !== null && node.checked !== undefined) {
      count += 1
      if (count === index) {
        targetOffset = node.position?.start.offset ?? null
        return
      }
    }
    if ('children' in node) {
      for (const child of (node as Parent).children) {
        walk(child)
        if (targetOffset !== null) return
      }
    }
  }
  walk(tree)

  if (targetOffset === null) return source
  // 체크박스는 항상 목록 항목 맨 앞("- [ ] ...")이라, 시작 위치 바로 뒤 몇 글자 안에서만 찾는다.
  const window = source.slice(targetOffset, targetOffset + 20)
  const match = /\[([ xX])\]/.exec(window)
  if (!match) return source

  const bracketStart = targetOffset + match.index
  const checked = match[1].trim() !== ''
  const flipped = checked ? ' ' : 'x'
  return source.slice(0, bracketStart) + `[${flipped}]` + source.slice(bracketStart + 3)
}
