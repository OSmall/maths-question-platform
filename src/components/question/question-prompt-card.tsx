import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RichTextRenderer } from '@/components/rich-text/rich-text-renderer'
import type { Question } from '@/lib/domain/question'

type QuestionPromptCardProps = {
  question: Question
}

export const QuestionPromptCard = ({ question }: QuestionPromptCardProps) => {
  return (
    <Card className="rounded-3xl border-emerald-100 bg-white py-0 shadow-sm dark:border-emerald-500/30 dark:bg-slate-900/95">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Question prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <RichTextRenderer
          className="text-base leading-7 text-slate-800 dark:text-slate-100"
          data={question.richText}
        />
      </CardContent>
    </Card>
  )
}
