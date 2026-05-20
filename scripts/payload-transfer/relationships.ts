import type { ImportedId, LegacyId } from './types'

export function legacyRelationshipId(value: unknown, label: string): LegacyId {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'number') {
    return value.id
  }

  throw new Error(`${label} expected a numeric relationship ID.`)
}

export function optionalLegacyRelationshipIds(value: unknown, label: string): LegacyId[] | null {
  if (value == null) {
    return null
  }

  if (!Array.isArray(value)) {
    throw new Error(`${label} expected a relationship ID array.`)
  }

  return value.map((item, index) => legacyRelationshipId(item, `${label}[${index}]`))
}

export function mappedId(
  map: Record<string, ImportedId>,
  legacyId: LegacyId,
  label: string,
): ImportedId {
  const id = map[String(legacyId)]

  if (id == null) {
    throw new Error(`${label} missing imported ID for legacy ID ${legacyId}.`)
  }

  return id
}

export function relationshipId(value: unknown): ImportedId | undefined {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    (typeof value.id === 'number' || typeof value.id === 'string')
  ) {
    return value.id
  }

  return undefined
}
