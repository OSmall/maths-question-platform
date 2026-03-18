import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Question } from '@/lib/domain/question'

type QuestionSidebarNavProps = {
  question: Question
}

export const QuestionSidebarNav = ({ question }: QuestionSidebarNavProps) => {
  return (
    <aside className="space-y-4 lg:sticky lg:top-8 lg:col-span-4 lg:self-start">
      <Card className="rounded-3xl border-emerald-100 bg-gradient-to-b from-emerald-50 to-white py-0 dark:border-emerald-500/30 dark:from-emerald-950/35 dark:to-slate-900">
        <CardContent className="space-y-2 py-5">
          <Badge
            className="w-fit border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-400/60 dark:bg-emerald-500/20 dark:text-emerald-100"
            variant="outline"
          >
            Attempt eight
          </Badge>
          <CardTitle className="text-xl leading-tight font-semibold text-slate-900 dark:text-slate-100">
            Split study layout
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-300">Question #{question.id}</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-emerald-100 bg-white py-0 dark:border-emerald-500/30 dark:bg-slate-900/95">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-300">
            Parts
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <ul className="space-y-2">
            {question.parts.map((part, index) => {
              return (
                <li key={part.id}>
                  <a
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-100"
                    href={`#part-${part.id}`}
                  >
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-100">
                      {index + 1}
                    </span>
                    Part {index + 1}
                  </a>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </aside>
  )
}
