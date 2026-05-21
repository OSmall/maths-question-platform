import type { PayloadRequest } from 'payload'

type TopicInput = {
  name?: string | null
}

type SubTopicInput = {
  name?: string | null
  topic?: string | { id?: string | null } | null
}

function normalizeTaxonomyName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function formatTaxonomyName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function extractRelationshipId(value: string | { id?: string | null } | null | undefined) {
  if (typeof value === 'string') {
    return value
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string'
  ) {
    return value.id
  }

  return undefined
}

export async function validateUniqueTopicName({
  id,
  name,
  req,
}: {
  id?: string
  name: string | null | undefined
  req: PayloadRequest
}) {
  if (!name) {
    return true
  }

  const normalizedName = normalizeTaxonomyName(name)
  const existingTopics = await req.payload.find({
    collection: 'topic',
    depth: 0,
    limit: 200,
    pagination: false,
    req,
    select: {
      id: true,
      name: true,
    },
  })

  const conflictingTopic = existingTopics.docs.find((topic) => {
    if (topic.id === id) {
      return false
    }

    return normalizeTaxonomyName(topic.name) === normalizedName
  })

  if (conflictingTopic) {
    return 'Topic names must be unique, ignoring case and repeated whitespace.'
  }

  return true
}

export async function validateUniqueSubTopicName({
  id,
  name,
  req,
  topic,
}: {
  id?: string
  name: string | null | undefined
  req: PayloadRequest
  topic: SubTopicInput['topic']
}) {
  const topicId = extractRelationshipId(topic)

  if (!name || typeof topicId !== 'string') {
    return true
  }

  const normalizedName = normalizeTaxonomyName(name)
  const existingSubTopics = await req.payload.find({
    collection: 'subTopic',
    depth: 0,
    limit: 500,
    pagination: false,
    req,
    select: {
      id: true,
      name: true,
      topic: true,
    },
  })

  const conflictingSubTopic = existingSubTopics.docs.find((subTopic) => {
    if (subTopic.id === id) {
      return false
    }

    return (
      extractRelationshipId(subTopic.topic) === topicId &&
      normalizeTaxonomyName(subTopic.name) === normalizedName
    )
  })

  if (conflictingSubTopic) {
    return 'Subtopic names must be unique within a topic, ignoring case and repeated whitespace.'
  }

  return true
}

export function normalizeTopicInput(data: TopicInput | null | undefined) {
  if (!data) {
    return data
  }

  if (typeof data.name === 'string') {
    data.name = formatTaxonomyName(data.name)
  }

  return data
}

export function normalizeSubTopicInput(data: SubTopicInput | null | undefined) {
  if (!data) {
    return data
  }

  if (typeof data.name === 'string') {
    data.name = formatTaxonomyName(data.name)
  }

  return data
}
