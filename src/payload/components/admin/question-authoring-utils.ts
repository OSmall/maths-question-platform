import { parseUUID, uuidSchema, type UUID } from '@/lib/domain/uuid'

type RelationshipLikeValue =
  | string
  | {
      id?: string | null
      value?: string | null
    }
  | null
  | undefined

type BlankQuestionDraftData = {
  _status: 'draft'
  subTopics?: UUID[]
}

type StarterQuestionDraftData = BlankQuestionDraftData & {
  parts: Array<Record<string, never>>
}

export function extractSubTopicIDs(value: unknown): UUID[] {
  if (!Array.isArray(value)) {
    return []
  }

  const ids = value
    .map((entry) => extractSubTopicID(entry as RelationshipLikeValue))
    .filter((id): id is UUID => id !== undefined)

  return Array.from(new Set(ids))
}

export function buildBlankQuestionDraftData(
  subTopicIDs: readonly UUID[],
): BlankQuestionDraftData {
  return buildQuestionDraftData(subTopicIDs)
}

export function buildStarterQuestionDraftData(
  subTopicIDs: readonly UUID[],
): StarterQuestionDraftData {
  return buildQuestionDraftData(subTopicIDs, {
    parts: [{}],
  })
}

function buildQuestionDraftData<TExtraData extends Record<string, unknown> = Record<never, never>>(
  subTopicIDs: readonly UUID[],
  extraData?: TExtraData,
): BlankQuestionDraftData & TExtraData {
  const normalizedSubTopicIDs = Array.from(
    new Set(
      subTopicIDs
        .filter((id): id is UUID => uuidSchema.safeParse(id).success),
    ),
  )

  return {
    ...(extraData ?? ({} as TExtraData)),
    ...(normalizedSubTopicIDs.length > 0 ? { subTopics: normalizedSubTopicIDs } : {}),
    _status: 'draft' as const,
  }
}

function extractSubTopicID(value: RelationshipLikeValue): UUID | undefined {
  if (typeof value === 'string') {
    return uuidSchema.safeParse(value).success ? parseUUID(value) : undefined
  }

  if (!value || typeof value !== 'object') {
    return undefined
  }

  if (typeof value.id === 'string') {
    return uuidSchema.safeParse(value.id).success ? parseUUID(value.id) : undefined
  }

  if (typeof value.value === 'string') {
    return uuidSchema.safeParse(value.value).success ? parseUUID(value.value) : undefined
  }

  return undefined
}
