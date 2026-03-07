import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { cn } from '@/lib/utils'

type RichTextRendererStaticProps = {
  className?: string
  data: null | SerializedEditorState | undefined
}

export const RichTextRendererStatic = ({ className, data }: RichTextRendererStaticProps) => {
  if (!data) {
    return null
  }

  const html = convertLexicalToHTML({ data })

  if (!html) {
    return null
  }

  return (
    <div
      className={cn(
        'text-sm leading-7 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-3 [&_ol]:my-3 [&_li]:ml-5',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
