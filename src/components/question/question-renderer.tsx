import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RichTextRenderer } from '@/components/rich-text/rich-text-renderer'
import { Question } from '@/lib/domain/question'

import { QuestionPartInput } from './question-part-input'

type QuestionRendererProps = {
  question: Question
}

export const QuestionRenderer = ({ question }: QuestionRendererProps) => {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            {/*<Badge variant="outline"></Badge>*/}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.richText !== undefined && <RichTextRenderer data={question.richText} />}
        </CardContent>
      </Card>

      {question.parts.map((part, index) => {
        return (
          <Card key={part.id}>
            <CardHeader>
              <CardTitle>Part {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {part.richText !== undefined && <RichTextRenderer data={part.richText} />}
              <QuestionPartInput part={part} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
