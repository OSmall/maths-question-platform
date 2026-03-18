import { Textarea } from '@/components/ui/textarea'

export const QuestionFreeTextInput = () => {
  return (
    <Textarea
      className="min-h-24 rounded-xl border-emerald-200 bg-white text-slate-800 placeholder:text-slate-500 focus-visible:border-emerald-500 dark:border-emerald-500/35 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:border-emerald-300"
      placeholder="Type your answer"
    />
  )
}
