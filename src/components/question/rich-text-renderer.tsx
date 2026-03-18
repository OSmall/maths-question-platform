'use client'

import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { useMemo } from 'react'

import { cn } from '@/lib/utils'

type RichTextRendererProps = {
  className?: string
  data: null | SerializedEditorState
}

export const RichTextRenderer = ({ className, data }: RichTextRendererProps) => {
  const html = useMemo(() => {
    if (!data) {
      return ''
    }

    return convertLexicalToHTML({ data })
  }, [data])

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
