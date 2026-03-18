import type { Question } from '@/lib/domain/question'

import { QuestionPartCard } from './question-part-card'
import { QuestionPromptCard } from './question-prompt-card'
import { QuestionSidebarNav } from './question-sidebar-nav'

type QuestionRendererProps = {
  question: Question
}

export const QuestionRenderer = ({ question }: QuestionRendererProps) => {
  return (
    <section className="w-full max-w-6xl rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-xl backdrop-blur-sm dark:border-emerald-500/30 dark:bg-slate-950/80 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-12">
        <QuestionSidebarNav question={question} />

        <div className="space-y-5 lg:col-span-8">
          <QuestionPromptCard question={question} />

          {question.parts.map((part, index) => {
            return <QuestionPartCard index={index} key={part.id} part={part} />
          })}
        </div>
      </div>
    </section>
  )
}
