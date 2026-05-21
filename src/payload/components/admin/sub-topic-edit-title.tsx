// todo fix this up. when creating sub topic, the text appears weirdly

import type { BeforeDocumentControlsServerProps } from 'payload'

type TopicDocument = {
  name?: string | null
}

type SubTopicDocument = {
  name?: string | null
  topic?: string | TopicDocument | null
}

export async function SubTopicEditTitle({ id, payload }: BeforeDocumentControlsServerProps) {
  if (!id) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>New Subtopic</h1>
        <p style={{ color: 'var(--theme-text-dim)', marginTop: '0.35rem' }}>
          Choose a topic, then give the subtopic a clear curriculum label.
        </p>
      </div>
    )
  }

  const subTopic = (await payload.findByID({
    collection: 'subTopic',
    id,
    depth: 1,
    select: {
      name: true,
      topic: true,
    },
  })) as SubTopicDocument

  const topicName = getTopicName(subTopic.topic)
  const title =
    topicName && typeof subTopic.name === 'string'
      ? `${topicName} / ${subTopic.name}`
      : (subTopic.name ?? 'Subtopic')

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{title}</h1>
      {topicName ? (
        <p style={{ color: 'var(--theme-text-dim)', marginTop: '0.35rem' }}>
          Stored once as a topic relationship plus a local subtopic name.
        </p>
      ) : null}
    </div>
  )
}

function getTopicName(topic: string | TopicDocument | null | undefined) {
  if (!topic || typeof topic === 'string') {
    return undefined
  }

  return typeof topic.name === 'string' ? topic.name : undefined
}
