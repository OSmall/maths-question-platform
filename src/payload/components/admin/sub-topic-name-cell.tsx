// todo fix this up. I can't click the link

import { Link } from '@payloadcms/ui'
import type { DefaultServerCellComponentProps } from 'payload'

type TopicRowData = {
  name?: string | null
}

type SubTopicRowData = {
  topic?: string | TopicRowData | null
}

export async function SubTopicNameCell({
  cellData,
  className,
  link,
  linkURL,
  payload,
  rowData,
}: DefaultServerCellComponentProps) {
  const topicName = await getTopicName(payload, (rowData as SubTopicRowData | undefined)?.topic)

  const content = (
    <div className={className} style={{ display: 'grid', gap: '0.15rem' }}>
      <span style={{ fontWeight: 600 }}>
        {typeof cellData === 'string' ? cellData : 'Untitled'}
      </span>
      {topicName ? (
        <span style={{ color: 'var(--theme-text-dim)', fontSize: '0.82rem' }}>{topicName}</span>
      ) : null}
    </div>
  )

  if (link && linkURL) {
    return (
      <Link
        href={linkURL}
        prefetch={false}
        style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}
      >
        {content}
      </Link>
    )
  }

  return content
}

async function getTopicName(
  payload: DefaultServerCellComponentProps['payload'],
  topic: string | TopicRowData | null | undefined,
) {
  if (!topic) {
    return undefined
  }

  if (typeof topic === 'string') {
    const topicDoc = await payload.findByID({
      collection: 'topic',
      id: topic,
      depth: 0,
      select: {
        name: true,
      },
    })

    return typeof topicDoc.name === 'string' ? topicDoc.name : undefined
  }

  return typeof topic.name === 'string' ? topic.name : undefined
}
