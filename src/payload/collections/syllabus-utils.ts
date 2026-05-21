import type { PayloadRequest } from 'payload'

type SyllabusInput = {
  name?: string | null
}

type SyllabusSubTopicInput = {
  status?: 'assumedKnowledge' | 'included' | null
  subTopic?: number | { id?: number | null } | null
  syllabus?: number | { id?: number | null } | null
}

type FindSyllabusSubTopics = (options: {
  collection: 'syllabusSubTopic'
  depth: 0
  limit: number
  pagination: false
  req?: PayloadRequest
}) => Promise<{ docs: unknown[] }>

type SyllabusSubTopicValidationRequest = {
  payload: {
    find: FindSyllabusSubTopics
  }
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
  req: SyllabusSubTopicValidationRequest
  subTopic: SyllabusSubTopicInput['subTopic']
  syllabus: SyllabusSubTopicInput['syllabus']
}) {
  const syllabusId = extractRelationshipId(args.syllabus)
  const subTopicId = extractRelationshipId(args.subTopic)

  if (typeof syllabusId !== 'number' || typeof subTopicId !== 'number') {
    return true
  }

  const req = isPayloadRequest(args.req) ? args.req : undefined

  const existingMappings = await args.req.payload.find({
    collection: 'syllabusSubTopic',
    depth: 0,
    limit: 1000,
    pagination: false,
    req,
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

function isPayloadRequest(req: SyllabusSubTopicValidationRequest | PayloadRequest): req is PayloadRequest {
  return 'headers' in req
}
