import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { RenderUpload } from './render-upload'

export const richTextConverters: JSXConvertersFunction<DefaultNodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  upload: ({ node }) => {
    return <RenderUpload node={node} />
  },
})
