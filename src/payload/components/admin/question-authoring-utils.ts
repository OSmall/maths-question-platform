type RelationshipLikeValue =
  | number
  | string
  | {
      id?: number | string | null
      value?: number | string | null
    }
  | null
  | undefined

type BlankQuestionDraftData = {
  _status: 'draft'
  subTopics?: number[]
}

type StarterQuestionDraftData = BlankQuestionDraftData & {
  parts: Array<Record<string, never>>
}

function parsePositiveInteger(value: number | string) {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined
  }

  return parsed
}

export function extractSubTopicIDs(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  const ids = value
    .map((entry) => extractSubTopicID(entry as RelationshipLikeValue))
    .filter((entry): entry is number => typeof entry === 'number')

  return Array.from(new Set(ids))
}

export function buildBlankQuestionDraftData(
  subTopicIDs: readonly number[],
): BlankQuestionDraftData {
  return buildQuestionDraftData(subTopicIDs)
}

export function buildStarterQuestionDraftData(
  subTopicIDs: readonly number[],
): StarterQuestionDraftData {
  return buildQuestionDraftData(subTopicIDs, {
    parts: [{}],
  })
}

function buildQuestionDraftData<TExtraData extends Record<string, unknown> = Record<never, never>>(
  subTopicIDs: readonly number[],
  extraData?: TExtraData,
): BlankQuestionDraftData & TExtraData {
  const normalizedSubTopicIDs = Array.from(
    new Set(
      subTopicIDs
        .map((id) => parsePositiveInteger(id))
        .filter((id): id is number => typeof id === 'number'),
    ),
  )

  return {
    ...(extraData ?? ({} as TExtraData)),
    ...(normalizedSubTopicIDs.length > 0 ? { subTopics: normalizedSubTopicIDs } : {}),
    _status: 'draft' as const,
  }
}

function extractSubTopicID(value: RelationshipLikeValue) {
  if (typeof value === 'number' || typeof value === 'string') {
    return parsePositiveInteger(value)
  }

  if (!value || typeof value !== 'object') {
    return undefined
  }

  if (typeof value.id === 'number' || typeof value.id === 'string') {
    return parsePositiveInteger(value.id)
  }

  if (typeof value.value === 'number' || typeof value.value === 'string') {
    return parsePositiveInteger(value.value)
  }

  return undefined
}
