import { Badge } from '@/components/ui/badge'
import { BookOpen, NotebookPen } from 'lucide-react'
import { RichTextRenderer } from '@/components/rich-text/rich-text-renderer'
import { answerTypeLabel } from '@/components/question/question-utils'
import type { RenderableQuestion } from '@/lib/domain/question'

type QuestionHeaderProps = {
  isDraftMode: boolean
  question: RenderableQuestion
  answeredParts: number
}

export const QuestionHeader = ({ isDraftMode, question, answeredParts }: QuestionHeaderProps) => {
  const answerTypes = Array.from(
    new Set(question.parts.map((part) => answerTypeLabel(part.response.type))),
  )

  return (
    <header className="space-y-6 border-b border-border/70 px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
          Question {question.index}
        </Badge>
        {answerTypes.map((label) => (
          <Badge
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            key={label}
            variant="outline"
          >
            {label}
          </Badge>
        ))}
        {isDraftMode ? (
          <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
            Live draft preview
          </Badge>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <BookOpen className="size-4" />
            Read the full prompt first, then answer every part.
          </span>
          <span className="inline-flex items-center gap-2">
            <NotebookPen className="size-4" />
            {answeredParts} of {question.parts.length} parts recorded
          </span>
        </div>

        <RichTextRenderer
          className="max-w-4xl text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9 [&_figure]:my-6 [&_figure]:overflow-hidden [&_figure]:rounded-[1.6rem] [&_figure]:border [&_figure]:border-border/70 [&_figure]:bg-background/80 [&_figure]:shadow-[0_20px_40px_-32px_rgba(15,23,42,0.38)] [&_img]:max-h-107.5 [&_img]:w-full [&_img]:object-contain [&_p:first-child]:text-[1.7rem] [&_p:first-child]:leading-[1.18] [&_p:first-child]:font-semibold [&_p:first-child]:tracking-tight sm:[&_p:first-child]:text-[2.35rem]"
          data={question.prompt}
        />
      </div>
    </header>
  )
}
