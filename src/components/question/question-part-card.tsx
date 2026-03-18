import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RichTextRenderer } from '@/components/rich-text/rich-text-renderer'
import type { QuestionPart } from '@/lib/domain/question'

import { QuestionPartInput } from './question-part-input'

type QuestionPartCardProps = {
  index: number
  part: QuestionPart
}

export const QuestionPartCard = ({ index, part }: QuestionPartCardProps) => {
  return (
    <Card
      className="rounded-3xl border-emerald-100 bg-white py-0 shadow-sm dark:border-emerald-500/30 dark:bg-slate-900/95"
      id={`part-${part.id}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '360px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white dark:bg-emerald-500">
            {index + 1}
          </span>
          <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Part {index + 1}
          </CardTitle>
        </div>
        <Separator className="bg-emerald-100 dark:bg-emerald-500/30" />
      </CardHeader>

      <CardContent className="space-y-5 pb-6">
        {part.richText ? (
          <RichTextRenderer
            className="text-sm leading-7 text-slate-700 dark:text-slate-200"
            data={part.richText}
          />
        ) : null}

        <QuestionPartInput part={part} />
      </CardContent>
    </Card>
  )
}
