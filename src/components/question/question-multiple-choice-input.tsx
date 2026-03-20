import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { MultipleChoiceResponse } from '@/lib/domain/question'

type QuestionMultipleChoiceInputProps = {
  response: MultipleChoiceResponse
  partId: string
}

export const QuestionMultipleChoiceInput = ({
  response,
  partId,
}: QuestionMultipleChoiceInputProps) => {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-[0.14em] text-emerald-700 uppercase dark:text-emerald-300">
        Pick an option
      </p>

      <RadioGroup className="gap-2">
        {response.choices.map((choice) => {
          const choiceId = `question-${partId}-${choice.id}`

          return (
            <Card
              className="rounded-xl border-emerald-100 bg-white py-0 shadow-none transition-colors hover:border-emerald-300 dark:border-emerald-500/35 dark:bg-slate-900/85 dark:hover:border-emerald-400/60"
              key={choice.id}
              size="sm"
            >
              <CardContent className="px-3 py-2.5">
                <div className="flex items-start gap-3">
                  <RadioGroupItem id={choiceId} value={choice.id} />
                  <Label
                    className="text-sm leading-6 text-slate-700 dark:text-slate-100"
                    htmlFor={choiceId}
                  >
                    {choice.text}
                  </Label>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </RadioGroup>
    </div>
  )
}
