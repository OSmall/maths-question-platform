export default function QuestionNotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">Question Not Found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          We could not find that question. Check the URL and try again.
        </p>
      </div>
    </div>
  )
}
