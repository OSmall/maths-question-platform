import { err, ok } from 'neverthrow'

import type {
  QuestionReviewPayload,
  QuestionReviewPart,
  SubmittedQuestionResponses,
} from '@/lib/domain/question-review'
import type { QuestionReviewSource } from '@/lib/domain/question'
import { NotANumberError } from '@/lib/errors'
import { fetchQuestionReviewSourceByIdAndDraft } from '@/lib/repository/question-repository'

type ReviewQuestionSubmissionOptions = {
  draft?: boolean
}

export function reviewQuestionSubmissionById(
  id: string | number,
  responses: SubmittedQuestionResponses,
  options: ReviewQuestionSubmissionOptions = {},
) {
  const isDraft = options.draft ?? false

  return ok(id)
    .andThen((value) => {
      const idNumber = Number(value)
      return isNaN(idNumber) ? err(new NotANumberError(value)) : ok(idNumber)
    })
    .asyncAndThen((idNumber) => fetchQuestionReviewSourceByIdAndDraft(idNumber, isDraft))
    .map((questionReviewSource) => buildQuestionReviewPayload(questionReviewSource, responses))
}

function buildQuestionReviewPayload(
  questionReviewSource: QuestionReviewSource,
  responses: SubmittedQuestionResponses,
): QuestionReviewPayload {
  return {
    nextQuestionLabel: `Question ${questionReviewSource.id + 1}`,
    parts: Object.fromEntries(
      questionReviewSource.parts.map((part) => [
        part.id,
        buildQuestionReviewPart(part, responses[part.id]),
      ]),
    ),
  }
}

function buildQuestionReviewPart(
  part: QuestionReviewSource['parts'][number],
  response: string | undefined,
): QuestionReviewPart {
  if (!response) {
    return {
      body: 'You left this blank. Read the worked solutions below, then compare them to how you would rebuild the answer next time.',
      status: 'unanswered',
      title: 'No answer submitted',
      workedSolutions: part.workedSolutions,
    }
  }

  switch (part.response.type) {
    case 'multipleChoice': {
      const correctChoice = part.response.choices.find((choice) => choice.isCorrect)
      const selectedChoice = part.response.choices.find((choice) => choice.id === response)

      if (correctChoice?.id === response) {
        return {
          body: 'You selected the best-supported option. Use the worked solutions to confirm why the distractors fall away.',
          correctAnswerText: correctChoice.text,
          status: 'correct',
          title: 'Correct answer',
          workedSolutions: part.workedSolutions,
        }
      }

      return {
        body: selectedChoice
          ? `You chose "${selectedChoice.text}". Review the worked solutions below to see which clue in the prompt should have ruled it out.`
          : 'Review the worked solutions below to compare your selection with the strongest mathematical route.',
        correctAnswerText: correctChoice?.text,
        status: 'incorrect',
        title: 'Needs review',
        workedSolutions: part.workedSolutions,
      }
    }
    case 'shortText':
      return isAcceptedShortTextAnswer(response, part.response.acceptedAnswers)
        ? {
            body: 'Your submitted final answer matches one of the accepted answers for this part.',
            status: 'correct',
            title: 'Correct answer',
            workedSolutions: part.workedSolutions,
          }
        : {
            body: 'Your final answer does not match the accepted answers yet. Compare your working against the solutions below.',
            status: 'incorrect',
            title: 'Needs review',
            workedSolutions: part.workedSolutions,
          }
    case 'selfReport':
      return response === 'correct'
        ? {
            body: 'You marked this part as solved. Use the model solution as a final confidence check.',
            status: 'correct',
            title: 'Marked as solved',
            workedSolutions: part.workedSolutions,
          }
        : {
            body: 'You marked this part for review. Read the worked solutions and focus on where your reasoning diverged from the model solution.',
            status: 'incorrect',
            title: 'Marked for review',
            workedSolutions: part.workedSolutions,
          }
  }
}

function isAcceptedShortTextAnswer(response: string, acceptedAnswers: string[]) {
  const normalizedResponse = normalizeAnswer(response)

  return acceptedAnswers.some(
    (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedResponse,
  )
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}
