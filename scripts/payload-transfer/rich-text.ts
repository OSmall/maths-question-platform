import { mappedId } from './relationships'
import type { CollectionIdMap, LegacyId } from './types'

type JsonRecord = Record<string, unknown>

export function remapRichTextMediaUploads(
  value: unknown,
  mediaMap: CollectionIdMap,
  label: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry, index) => remapRichTextMediaUploads(entry, mediaMap, `${label}[${index}]`))
  }

  if (!isRecord(value)) {
    return value
  }

  const remapped = Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      remapRichTextMediaUploads(entry, mediaMap, `${label}.${key}`),
    ]),
  )

  if (value.type === 'upload' && value.relationTo === 'media') {
    remapped.value = remapUploadNodeValue(value.value, mediaMap, `${label}.value`)
  }

  return remapped
}

function remapUploadNodeValue(value: unknown, mediaMap: CollectionIdMap, label: string) {
  if (typeof value === 'number') {
    return mappedId(mediaMap, value, label)
  }

  if (isRecord(value) && typeof value.id === 'number') {
    return {
      ...value,
      id: mappedId(mediaMap, value.id as LegacyId, `${label}.id`),
    }
  }

  return value
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object'
}
