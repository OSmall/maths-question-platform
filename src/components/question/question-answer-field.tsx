import type {
  RenderableQuestionPart,
  RenderableQuestionSubmissionEvaluation,
} from '@/lib/domain/question'
import { cn } from '@/lib/utils'

type QuestionAnswerFieldProps = {
  fieldIndex: number
  questionPart: RenderableQuestionPart
  questionSubmissionEvaluation: RenderableQuestionSubmissionEvaluation
  shuffleKeyBase: string
}

export const QuestionAnswerField = ({
  fieldIndex,
  questionPart,
  questionSubmissionEvaluation,
  shuffleKeyBase,
}: QuestionAnswerFieldProps) => {
  const valueFieldName = `answers.${fieldIndex}.value`
  const questionSubmissionEvaluationPart = questionSubmissionEvaluation.parts[questionPart.id]
  const isEvaluated = questionSubmissionEvaluation.isEvaluated

  if (!questionSubmissionEvaluationPart) {
    throw new Error(
      `Missing question submission evaluation data for part ${questionPart.id} (isEvaluated=${String(questionSubmissionEvaluation.isEvaluated)})`,
    )
  }

  switch (questionPart.response.type) {
    case 'multipleChoice': {
      if (questionSubmissionEvaluationPart.type !== 'multipleChoice')
        throw new Error(
          `Expected questionSubmissionEvaluationPart to be multipleChoice but found ${questionSubmissionEvaluationPart.type}`,
        ) // todo think about improving this error handling or aligning the types such that the response types are equal
      const choiceObjs = Object.values(questionPart.response.choices)
      const displayedChoices = questionPart.response.shuffle
        ? shuffleChoices(choiceObjs, `${shuffleKeyBase}:${questionPart.id}`)
        : choiceObjs

      return (
        <div className="flex flex-col gap-3">
          <AnswerRowIdentityFields
            fieldIndex={fieldIndex}
            partId={questionPart.id}
            type={questionPart.response.type}
          />
          {displayedChoices.map((choice, index) => {
            const choiceId = `${questionPart.id}-${choice.id}`
            const isSelected = questionSubmissionEvaluationPart.givenChoiceId === choice.id

            return (
              <label
                className={cn(
                  'group flex cursor-pointer items-start gap-4 rounded-4xl border border-border/70 bg-background/80 px-4 py-4 transition-all hover:border-primary/35 hover:bg-primary/5',
                  isSelected &&
                    'border-primary/50 bg-primary/8 shadow-[0_12px_30px_-24px_rgba(16,185,129,0.75)]',
                  isEvaluated && 'cursor-default opacity-85',
                )}
                htmlFor={choiceId}
                key={choice.id}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-sm font-semibold text-muted-foreground transition-colors group-hover:border-primary/35 group-hover:text-primary">
                  {String.fromCharCode(65 + index)}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm leading-7 text-foreground sm:text-[15px]">{choice.text}</p>
                </div>

                <input
                  className="mt-1 size-4 accent-primary"
                  defaultChecked={isSelected}
                  disabled={isEvaluated}
                  id={choiceId}
                  name={valueFieldName}
                  required={!isEvaluated}
                  type="radio"
                  value={choice.id}
                />
              </label>
            )
          })}
        </div>
      )
    }
    case 'shortText':
      if (questionSubmissionEvaluationPart.type !== 'shortText')
        throw new Error(
          `Expected questionSubmissionEvaluationPart to be shortText but found ${questionSubmissionEvaluationPart.type}`,
        ) // todo think about improving this error handling or aligning the types such that the response types are equal
      return (
        <>
          <AnswerRowIdentityFields
            fieldIndex={fieldIndex}
            partId={questionPart.id}
            type={questionPart.response.type}
          />
          <textarea
            className="min-h-32 w-full rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3 text-base leading-7 text-foreground placeholder:text-muted-foreground focus:border-primary/45 focus:outline-none disabled:cursor-default disabled:opacity-85"
            defaultValue={questionSubmissionEvaluationPart.givenResponse}
            disabled={isEvaluated}
            name={valueFieldName}
            placeholder="Type your final answer"
            required={!isEvaluated}
          />
        </>
      )
    case 'selfReport':
      if (questionSubmissionEvaluationPart.type !== 'selfReport')
        throw new Error(
          `Expected questionSubmissionEvaluationPart to be selfReport but found ${questionSubmissionEvaluationPart.type}`,
        ) // todo think about improving this error handling or aligning the types such that the response types are equal
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <AnswerRowIdentityFields
            fieldIndex={fieldIndex}
            partId={questionPart.id}
            type={questionPart.response.type}
          />
          {[
            {
              description:
                'I solved it confidently and want to compare my working against the model solution.',
              label: 'I got this',
              value: 'correct',
            },
            {
              description:
                'I want to see the worked method and compare where my reasoning broke down.',
              label: 'Needs review',
              value: 'incorrect',
            },
          ].map((option) => {
            const optionId = `${questionPart.id}-${option.value}`
            const isSelected =
              questionSubmissionEvaluationPart.givenResponse === (option.value === 'correct')

            return (
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-4xl border px-4 py-4 text-left text-sm transition-all',
                  isSelected
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border/70 bg-background/80 text-foreground hover:bg-accent',
                  isEvaluated && 'cursor-default opacity-85',
                )}
                htmlFor={optionId}
                key={option.value}
              >
                <input
                  className="mt-1 size-4 accent-primary"
                  defaultChecked={isSelected}
                  disabled={isEvaluated}
                  id={optionId}
                  name={valueFieldName}
                  required={!isEvaluated}
                  type="radio"
                  value={option.value}
                />
                <div className="space-y-1">
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{option.description}</p>
                </div>
              </label>
            )
          })}
        </div>
      )
    default:
      return null
  }
}

function AnswerRowIdentityFields({
  fieldIndex,
  partId,
  type,
}: {
  fieldIndex: number
  partId: string
  type: RenderableQuestionPart['response']['type']
}) {
  return (
    <>
      <input name={`answers.${fieldIndex}.partId`} type="hidden" value={partId} />
      <input name={`answers.${fieldIndex}.type`} type="hidden" value={type} />
    </>
  )
}

function shuffleChoices<T extends { id: string }>(choices: T[], seed: string) {
  return [...choices].sort((left, right) => {
    const leftScore = hashString(`${seed}:${left.id}`)
    const rightScore = hashString(`${seed}:${right.id}`)

    if (leftScore === rightScore) {
      return left.id.localeCompare(right.id)
    }

    return leftScore - rightScore
  })
}

function hashString(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}
