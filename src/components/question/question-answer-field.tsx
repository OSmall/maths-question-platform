import { cn } from '@/lib/utils'
import type { Question } from '@/lib/domain/question'

type QuestionAnswerFieldProps = {
  part: Question['parts'][number]
  response: string | undefined
  reviewMode: boolean
  seed: string
}

export const QuestionAnswerField = ({
  part,
  response,
  reviewMode,
  seed,
}: QuestionAnswerFieldProps) => {
  const fieldName = `a.${part.id}`

  switch (part.response.type) {
    case 'multipleChoice': {
      const displayedChoices = part.response.shuffle
        ? getSeededChoices(part.response.choices, `${seed}:${part.id}`)
        : part.response.choices

      return (
        <div className="space-y-3">
          {displayedChoices.map((choice, index) => {
            const choiceId = `${part.id}-${choice.id}`
            const isSelected = response === choice.id

            return (
              <label
                className={cn(
                  'group flex cursor-pointer items-start gap-4 rounded-4xl border border-border/70 bg-background/80 px-4 py-4 transition-all hover:border-primary/35 hover:bg-primary/5',
                  isSelected &&
                    'border-primary/50 bg-primary/8 shadow-[0_12px_30px_-24px_rgba(16,185,129,0.75)]',
                  reviewMode && 'cursor-default opacity-85',
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
                  disabled={reviewMode}
                  id={choiceId}
                  name={fieldName}
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
      return (
        <textarea
          className="min-h-32 w-full rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3 text-base leading-7 text-foreground placeholder:text-muted-foreground focus:border-primary/45 focus:outline-none disabled:cursor-default disabled:opacity-85"
          defaultValue={response ?? ''}
          disabled={reviewMode}
          name={fieldName}
          placeholder="Type your final answer"
        />
      )
    case 'selfReport':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
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
            const optionId = `${part.id}-${option.value}`
            const isSelected = response === option.value

            return (
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-4xl border px-4 py-4 text-left text-sm transition-all',
                  isSelected
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border/70 bg-background/80 text-foreground hover:bg-accent',
                  reviewMode && 'cursor-default opacity-85',
                )}
                htmlFor={optionId}
                key={option.value}
              >
                <input
                  className="mt-1 size-4 accent-primary"
                  defaultChecked={isSelected}
                  disabled={reviewMode}
                  id={optionId}
                  name={fieldName}
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

function getSeededChoices<T extends { id: string }>(choices: T[], seed: string) {
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
