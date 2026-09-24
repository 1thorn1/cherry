import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { IconCheck } from '@tabler/icons-react'

// react-markdown은 rehype-raw 없이는 원래도 마크다운에 섞인 원문 HTML(<script> 등)을
// 렌더링하지 않지만, 스펙(B-7/B-9)이 명시한 대로 sanitize를 한 겹 더 둔다.
// GFM 체크리스트("- [ ] ...")가 만드는 <input type="checkbox">만 기본 스키마에 추가로 허용한다.
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'input'],
  attributes: {
    ...defaultSchema.attributes,
    input: [...(defaultSchema.attributes?.input ?? []), 'type', 'checked', 'disabled'],
  },
}

export default function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="text-sm text-neutral-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          h1: ({ node: _node, ...rest }) => <h1 className="mb-1.5 mt-2 text-base font-semibold first:mt-0" {...rest} />,
          h2: ({ node: _node, ...rest }) => <h2 className="mb-1.5 mt-2 text-sm font-semibold first:mt-0" {...rest} />,
          h3: ({ node: _node, ...rest }) => <h3 className="mb-1 mt-2 text-sm font-medium first:mt-0" {...rest} />,
          p: ({ node: _node, ...rest }) => <p className="mb-2 whitespace-pre-wrap leading-relaxed last:mb-0" {...rest} />,
          // GFM 체크리스트("- [ ] ...")는 remark-gfm이 이 <ul>에 className="contains-task-list"를
          // 붙여서 넘겨준다. 예전엔 이 className이 우리가 준 list-disc 등을 그대로 덮어써서
          // 체크리스트만 여백·불릿 스타일이 통째로 날아가 있었다(체크박스 자체는 떴지만
          // 지저분해 보였음) — 이제 이 경우를 따로 분기해서 불릿 없이 정리된 형태로 준다.
          ul: ({ node: _node, className, ...rest }) => (
            <ul
              className={
                className === 'contains-task-list'
                  ? 'mb-2 space-y-1 last:mb-0'
                  : 'mb-2 list-disc space-y-0.5 pl-5 last:mb-0'
              }
              {...rest}
            />
          ),
          ol: ({ node: _node, ...rest }) => <ol className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0" {...rest} />,
          li: ({ node: _node, className, ...rest }) => (
            <li className={className === 'task-list-item' ? 'flex list-none items-start gap-1.5' : undefined} {...rest} />
          ),
          a: ({ node: _node, ...rest }) => (
            <a className="underline" style={{ color: 'var(--cherry)' }} target="_blank" rel="noreferrer" {...rest} />
          ),
          code: ({ node: _node, ...rest }) => <code className="rounded bg-neutral-100 px-1 py-0.5 text-[12px]" {...rest} />,
          pre: ({ node: _node, ...rest }) => (
            <pre className="mb-2 overflow-x-auto rounded-lg bg-neutral-100 p-2 text-[12px] last:mb-0" {...rest} />
          ),
          blockquote: ({ node: _node, ...rest }) => (
            <blockquote className="mb-2 border-l-2 pl-2 text-neutral-500 last:mb-0" style={{ borderColor: 'var(--cherry)' }} {...rest} />
          ),
          strong: ({ node: _node, ...rest }) => <strong className="font-semibold" {...rest} />,
          // 체크박스는 어차피 읽기 전용(disabled)이라, 브라우저마다 다르게 생긴 기본
          // input[type=checkbox] 대신 앱 다른 곳(마일스톤 칩)과 같은 모양의 체크박스로 그린다.
          input: ({ node: _node, checked, type, ...rest }) => {
            if (type !== 'checkbox') return <input type={type} {...rest} />
            return (
              <span
                className="mr-0.5 mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm"
                style={{
                  background: checked ? 'var(--cherry)' : 'white',
                  border: checked ? 'none' : '1.5px solid #D4D0C4',
                }}
              >
                {checked && <IconCheck size={9} stroke={3} color="white" />}
              </span>
            )
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
