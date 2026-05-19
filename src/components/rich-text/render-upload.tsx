import Image from 'next/image'
import type { SerializedUploadNode } from '@payloadcms/richtext-lexical'

import type { Media } from '@/payload/payload-types'

type UploadNode = SerializedUploadNode

const isMediaDocument = (value: UploadNode['value']): value is Media => {
  return typeof value === 'object' && value !== null && 'alt' in value
}

type RenderUploadProps = {
  node: UploadNode
}

export const RenderUpload = ({ node }: RenderUploadProps) => {
  if (node.relationTo !== 'media' || !isMediaDocument(node.value)) {
    return null
  }

  const { alt, filename, height, mimeType, url, width } = node.value

  if (!url) {
    return null
  }

  if (mimeType?.startsWith('image/') && width && height) {
    return (
      <figure className="my-4 overflow-hidden rounded-2xl border border-border bg-card">
        <Image
          alt={alt}
          className="h-auto w-full"
          height={height}
          priority={false}
          sizes="(min-width: 1024px) 768px, 100vw"
          src={url}
          width={width}
          loading="eager"
        />
      </figure>
    )
  }

  return (
    <a
      className="text-primary underline underline-offset-4"
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      {filename ?? alt}
    </a>
  )
}
