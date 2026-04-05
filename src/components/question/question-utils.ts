import type { RenderableQuestion } from '@/lib/domain/question'
import { assertNever } from '@/lib/utils/types'

export function answerTypeLabel(
  answerType: RenderableQuestion['parts'][number]['response']['type'],
) {
  switch (answerType) {
    case 'multipleChoice':
      return 'Multiple choice'
    case 'shortText':
      return 'Short text'
    case 'selfReport':
      return 'Self report'
    default:
      assertNever(answerType)
  }
}
