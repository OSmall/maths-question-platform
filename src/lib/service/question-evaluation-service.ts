import {
  QuestionPartResponseType,
  RenderableQuestionSubmissionEvaluatedPart,
  renderableQuestionSubmissionEvaluationSchema,
} from '../domain/question'
import { fetchQuestionEvaluationEnrichment, fetchQuestionPartResponseTypes, } from '../repository/question-repository'
import { assertNever, DistributiveOmit } from '../utils/types'
import { parseToResult } from '../utils/validation'
import * as R from 'remeda'

/**
 *
 * @param questionId question id
 * @param searchParams temporary - used for state before implementation of "StudySession"
 */
export function getQuestionSubmissionEvaluation(
  questionId: number,
  searchParams: Record<string, string | string[] | undefined>,
) {
  const isSubmitted = parseParam(searchParams.submitted) === '1'
  const parsedAnswers = parseAnswers(searchParams)

  if (!isSubmitted) {
    return fetchQuestionPartResponseTypes(questionId)
      .map((questionPartResponseTypes) => ({
        answeredParts: countAnsweredQuestionParts(questionPartResponseTypes, parsedAnswers),
        parts: buildUnevaluatedQuestionParts(questionPartResponseTypes, parsedAnswers),
      }))
      .andThen(({ answeredParts, parts }) =>
        parseToResult(renderableQuestionSubmissionEvaluationSchema, {
          isEvaluated: false,
          answeredParts,
          parts,
        }),
      )
  } else {
    return fetchQuestionEvaluationEnrichment(questionId)
      .map((enrichment) => {
        const questionPartResponseTypes = R.pipe(
          enrichment,
          R.entries(),
          R.map(([partId, part]) => [partId, part.type] as const),
          R.fromEntries(),
        )

        assertAllQuestionPartsAnswered(questionId, questionPartResponseTypes, parsedAnswers)

        const submittedParts = buildQuestionParts(questionPartResponseTypes, parsedAnswers)
        return buildPartsReadyForEvaluation(submittedParts, enrichment)
      })
      .map((partsReadyForEvaluation) => {
        const evaluatedParts = evaluateAnswers(partsReadyForEvaluation)
        const answeredParts = R.pipe(evaluatedParts, R.keys(), R.length())
        const correctParts = R.pipe(
          evaluatedParts,
          R.values(),
          R.sumBy((part) => (part.isCorrect ? 1 : 0)),
        )
        const incorrectParts = answeredParts - correctParts
        return {
          isEvaluated: true,
          answeredParts,
          correctParts,
          incorrectParts,
          parts: evaluatedParts,
        }
      })
      .andTee((candidate) =>
        console.debug(`question evaluation candidate object is ${JSON.stringify(candidate)}`),
      )
      .andThen((candidate) =>
        parseToResult(renderableQuestionSubmissionEvaluationSchema, candidate),
      )
  }
}

type PartReadyForEvaluation = DistributiveOmit<
  RenderableQuestionSubmissionEvaluatedPart,
  'isCorrect'
>

type SubmittedPart =
  | {
      type: 'shortText'
      givenResponse: string
    }
  | {
      type: 'selfReport'
      givenResponse: boolean
    }
  | {
      type: 'multipleChoice'
      givenChoiceId: string
    }

type UnevaluatedPart =
  | {
      type: 'shortText'
      givenResponse?: string
    }
  | {
      type: 'selfReport'
      givenResponse?: boolean
    }
  | {
      type: 'multipleChoice'
      givenChoiceId?: string
    }

type EvaluationEnrichmentPart =
  | {
      type: 'shortText'
      workedSolutions?: unknown
      correctResponses?: unknown
    }
  | {
      type: 'selfReport'
      workedSolutions?: unknown
    }
  | {
      type: 'multipleChoice'
      workedSolutions?: unknown
      correctChoiceId?: string | null
    }

type SubmittedPartByType = {
  [K in SubmittedPart['type']]: Extract<SubmittedPart, { type: K }>
}

type EvaluationEnrichmentPartByType = {
  [K in EvaluationEnrichmentPart['type']]: Extract<EvaluationEnrichmentPart, { type: K }>
}

type PartReadyForEvaluationByType = {
  [K in PartReadyForEvaluation['type']]: Extract<PartReadyForEvaluation, { type: K }>
}

function mergePart<K extends keyof PartReadyForEvaluationByType>(
  submittedPart: SubmittedPartByType[K],
  enrichmentPart: EvaluationEnrichmentPartByType[K],
) {
  return R.mergeDeep(submittedPart, enrichmentPart) as PartReadyForEvaluationByType[K]
}

function buildPartsReadyForEvaluation(
  submittedParts: Record<string, SubmittedPart>,
  enrichmentParts: Record<string, EvaluationEnrichmentPart>,
) {
  return R.mapValues(submittedParts, (submittedPart, partId) => {
    const enrichmentPart = enrichmentParts[partId]

    if (!enrichmentPart || enrichmentPart.type !== submittedPart.type) {
      throw new Error(`Mismatched evaluation data for part ${partId}`)
    }

    return mergePart(submittedPart, enrichmentPart)
  })
}

function evaluatePartAnswer(part: PartReadyForEvaluation) {
  if (part.type === 'selfReport') {
    return {
      ...part,
      isCorrect: part.givenResponse,
    }
  } else if (part.type === 'shortText') {
    return {
      ...part,
      isCorrect: part.correctResponses.includes(part.givenResponse),
    }
  } else if (part.type === 'multipleChoice') {
    return {
      ...part,
      isCorrect: part.correctChoiceId === part.givenChoiceId,
    }
  } else {
    assertNever(part)
  }
}

function evaluateAnswers(partIdToPartReadyForEvaluation: Record<string, PartReadyForEvaluation>) {
  return R.pipe(
    partIdToPartReadyForEvaluation,
    R.mapValues((part) => evaluatePartAnswer(part)),
  )
}

function buildQuestionParts(
  questionPartResponseTypes: Record<string, QuestionPartResponseType>,
  partIdToGivenAnswer: Record<string, string>,
) {
  return R.pipe(
    partIdToGivenAnswer,
    R.entries(),
    R.map(([partId, givenAnswer]) => {
      const partResponseType = questionPartResponseTypes[partId]
      if (partResponseType === 'shortText') {
        return [
          partId,
          {
            type: partResponseType,
            givenResponse: givenAnswer,
          },
        ] as const
      } else if (partResponseType === 'selfReport') {
        return [
          partId,
          {
            type: partResponseType,
            givenResponse: givenAnswer === 'correct',
          },
        ] as const
      } else if (partResponseType === 'multipleChoice') {
        return [
          partId,
          {
            type: partResponseType,
            givenChoiceId: givenAnswer,
          },
        ] as const
      } else {
        assertNever(partResponseType)
      }
    }),
    R.fromEntries(),
  )
}

function buildUnevaluatedQuestionParts(
  questionPartResponseTypes: Record<string, QuestionPartResponseType>,
  partIdToGivenAnswer: Record<string, string>,
) {
  return R.pipe(
    questionPartResponseTypes,
    R.entries(),
    R.map(([partId, partResponseType]) => {
      const givenAnswer = partIdToGivenAnswer[partId]

      if (partResponseType === 'shortText') {
        return [
          partId,
          {
            type: partResponseType,
            ...(givenAnswer === undefined ? {} : { givenResponse: givenAnswer }),
          },
        ] as const
      } else if (partResponseType === 'selfReport') {
        return [
          partId,
          {
            type: partResponseType,
            ...(givenAnswer === undefined ? {} : { givenResponse: givenAnswer === 'correct' }),
          },
        ] as const
      } else if (partResponseType === 'multipleChoice') {
        return [
          partId,
          {
            type: partResponseType,
            ...(givenAnswer === undefined ? {} : { givenChoiceId: givenAnswer }),
          },
        ] as const
      } else {
        assertNever(partResponseType)
      }
    }),
    R.fromEntries(),
  ) satisfies Record<string, UnevaluatedPart>
}

function countAnsweredQuestionParts(
  questionPartResponseTypes: Record<string, QuestionPartResponseType>,
  parsedAnswers: Record<string, string>,
) {
  return R.pipe(
    questionPartResponseTypes,
    R.keys(),
    R.filter((partId) => parsedAnswers[partId] !== undefined),
    R.length(),
  )
}

function assertAllQuestionPartsAnswered(
  questionId: number,
  questionPartResponseTypes: Record<string, QuestionPartResponseType>,
  parsedAnswers: Record<string, string>,
) {
  const missingPartIds = R.pipe(
    questionPartResponseTypes,
    R.keys(),
    R.filter((partId) => parsedAnswers[partId] === undefined),
  )

  if (missingPartIds.length > 0) {
    throw new Error(
      `Submitted question ${questionId} is missing answers for parts: ${missingPartIds.join(', ')}`,
    )
  }
}

function parseParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.at(-1)
  }

  return value
}

function parseAnswers(searchParams: Record<string, string | string[] | undefined>) {
  const partToGiven: Record<string, string> = {}
  for (const [key, value] of Object.entries(searchParams)) {
    console.trace(`searchParams key [${key}] value [${value}]`)
    if (!key.startsWith('a.')) continue
    const partId = key.substring(2)
    const parsed = parseParam(value)
    if (parsed !== undefined) partToGiven[partId] = parsed
  }
  console.trace(`partToGiven map [${JSON.stringify(partToGiven)}]`)
  return partToGiven
}
