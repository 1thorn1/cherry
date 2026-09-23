import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

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
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
          h1: (p) => <h1 className="mb-1.5 mt-2 text-base font-semibold first:mt-0" {...p} />,
          h2: (p) => <h2 className="mb-1.5 mt-2 text-sm font-semibold first:mt-0" {...p} />,
          h3: (p) => <h3 className="mb-1 mt-2 text-sm font-medium first:mt-0" {...p} />,
          p: (p) => <p className="mb-2 whitespace-pre-wrap leading-relaxed last:mb-0" {...p} />,
          ul: (p) => <ul className="mb-2 list-disc space-y-0.5 pl-5 last:mb-0" {...p} />,
          ol: (p) => <ol className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0" {...p} />,
          li: (p) => <li {...p} />,
          a: (p) => <a className="underline" style={{ color: 'var(--cherry)' }} target="_blank" rel="noreferrer" {...p} />,
          code: (p) => <code className="rounded bg-neutral-100 px-1 py-0.5 text-[12px]" {...p} />,
          pre: (p) => <pre className="mb-2 overflow-x-auto rounded-lg bg-neutral-100 p-2 text-[12px] last:mb-0" {...p} />,
          blockquote: (p) => (
            <blockquote className="mb-2 border-l-2 pl-2 text-neutral-500 last:mb-0" style={{ borderColor: 'var(--cherry)' }} {...p} />
          ),
          strong: (p) => <strong className="font-semibold" {...p} />,
          input: (p) => <input disabled className="mr-1.5 align-middle" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
