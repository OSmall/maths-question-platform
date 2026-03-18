import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { cn } from '@/lib/utils'

import { richTextConverters } from './converters'

type RichTextRendererProps = {
  className?: string
  data: null | SerializedEditorState | undefined
}

export const RichTextRenderer = ({ className, data }: RichTextRendererProps) => {
  if (!data) {
    return null
  }

  return (
    <RichText
      className={cn(
        'text-sm leading-7 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-3 [&_ol]:my-3 [&_li]:ml-5',
        className,
      )}
      converters={richTextConverters}
      data={data}
    />
  )
}
