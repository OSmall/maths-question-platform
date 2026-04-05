import type { PayloadRequest } from 'payload'

type SyllabusInput = {
  name?: string | null
}

type SyllabusSubTopicInput = {
  status?: 'assumedKnowledge' | 'included' | null
  subTopic?: number | { id?: number | null } | null
  syllabus?: number | { id?: number | null } | null
}

function extractRelationshipId(value: number | { id?: number | null } | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value === 'object' && typeof value.id === 'number') {
    return value.id
  }

  return undefined
}

export function normalizeSyllabusInput(data: SyllabusInput | null | undefined) {
  if (!data) {
    return data
  }

  if (typeof data.name === 'string') {
    data.name = data.name.trim()
  }

  return data
}

export function normalizeSyllabusSubTopicInput(data: SyllabusSubTopicInput | null | undefined) {
  if (!data) {
    return data
  }

  return data
}

export async function validateUniqueSyllabusSubTopic(args: {
  id?: number | string
  req: PayloadRequest
  subTopic: SyllabusSubTopicInput['subTopic']
  syllabus: SyllabusSubTopicInput['syllabus']
}) {
  const syllabusId = extractRelationshipId(args.syllabus)
  const subTopicId = extractRelationshipId(args.subTopic)

  if (typeof syllabusId !== 'number' || typeof subTopicId !== 'number') {
    return true
  }

  const existingMappings = await args.req.payload.find({
    collection: 'syllabusSubTopic' as never,
    depth: 0,
    limit: 1000,
    pagination: false,
    req: args.req,
  })

  const conflictingMapping = existingMappings.docs.find((mapping) => {
    const candidate = mapping as {
      id?: number | string
      subTopic?: number | { id?: number | null } | null
      syllabus?: number | { id?: number | null } | null
    }

    if (candidate.id === args.id) {
      return false
    }

    return (
      extractRelationshipId(candidate.syllabus) === syllabusId &&
      extractRelationshipId(candidate.subTopic) === subTopicId
    )
  })

  if (conflictingMapping) {
    return 'This subtopic is already mapped for the selected syllabus.'
  }

  return true
}
