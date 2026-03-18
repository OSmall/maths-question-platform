import { Button } from '@/components/ui/button'

export const QuestionSelfReportInput = () => {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/30"
        type="button"
        variant="outline"
      >
        Correct
      </Button>
      <Button
        className="rounded-full border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100 dark:hover:bg-amber-500/30"
        type="button"
        variant="outline"
      >
        Incorrect
      </Button>
    </div>
  )
}
