'use client'

import type React from 'react'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Flag,
  Layers3,
  NotebookPen,
  SkipForward,
  Target,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress, ProgressLabel } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/domain/question'

import { RichTextRenderer } from './rich-text-renderer'
import type {
  QuestionReviewPart,
  QuestionReviewPayload,
  QuestionSessionMeta,
} from './question-study-types'

type QuestionStudyExperienceProps = {
  isDraftMode: boolean
  question: Question
  reviewPayload: QuestionReviewPayload
  sessionMeta: QuestionSessionMeta
}

type PartResult = {
  accentClassName: string
  body: string
  status: 'correct' | 'incorrect' | 'unanswered'
  title: string
}

export const QuestionStudyExperience = ({
  isDraftMode,
  question,
  reviewPayload,
  sessionMeta,
}: QuestionStudyExperienceProps) => {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [isSaved, setIsSaved] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [flaggedPartIds, setFlaggedPartIds] = useState<string[]>(
    sessionMeta.sessionFlaggedCount > 0 && question.parts[0] ? [question.parts[0].id] : [],
  )

  const answeredCount = question.parts.filter((part) => hasResponse(responses[part.id])).length
  const completionPercent = Math.round((answeredCount / question.parts.length) * 100)
  const partResults = useMemo(() => {
    if (!isSubmitted) {
      return null
    }

    return Object.fromEntries(
      question.parts.map((part) => [
        part.id,
        evaluatePart(part, responses[part.id], reviewPayload.parts[part.id]),
      ]),
    ) as Record<string, PartResult>
  }, [isSubmitted, question.parts, responses, reviewPayload.parts])

  const reviewSummary = useMemo(() => {
    if (!partResults) {
      return null
    }

    const results = Object.values(partResults)
    const correctCount = results.filter((result) => result.status === 'correct').length
    const unansweredCount = results.filter((result) => result.status === 'unanswered').length

    return {
      accuracyPercent: Math.round((correctCount / question.parts.length) * 100),
      correctCount,
      incorrectCount: results.filter((result) => result.status === 'incorrect').length,
      unansweredCount,
    }
  }, [partResults, question.parts.length])

  const activeAccuracyLabel = reviewSummary
    ? `${reviewSummary.accuracyPercent}% this question`
    : `${sessionMeta.sessionAccuracyPercent}% so far`

  const footerPrimaryLabel = isSubmitted
    ? `Continue to ${reviewPayload.nextQuestionLabel}`
    : 'Check answer'

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSkipped(false)

    if (isSubmitted) {
      return
    }

    // Replace this local review transition with a server action or route call that returns
    // correctness and solutionMethods only after the student submits the full question.
    setIsSubmitted(true)
  }

  return (
    <form className="mx-auto w-full max-w-310" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 lg:gap-6">
        <MobileSessionHeader
          activeAccuracyLabel={activeAccuracyLabel}
          answeredCount={answeredCount}
          completionPercent={completionPercent}
          flaggedCount={flaggedPartIds.length}
          isDraftMode={isDraftMode}
          question={question}
          reviewSummary={reviewSummary}
          sessionMeta={sessionMeta}
        />

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
          <DesktopSessionRail
            activeAccuracyLabel={activeAccuracyLabel}
            answeredCount={answeredCount}
            completionPercent={completionPercent}
            flaggedCount={flaggedPartIds.length}
            isDraftMode={isDraftMode}
            question={question}
            reviewSummary={reviewSummary}
            sessionMeta={sessionMeta}
          />

          <div className="min-w-0 space-y-4 lg:space-y-5">
            <article className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:border-border/70 dark:bg-card/90">
              <QuestionHeader
                answeredCount={answeredCount}
                isDraftMode={isDraftMode}
                question={question}
                sessionMeta={sessionMeta}
              />

              {question.parts.map((part, index) => {
                const review = reviewPayload.parts[part.id]
                const result = partResults?.[part.id]
                const response = responses[part.id]
                const isFlagged = flaggedPartIds.includes(part.id)

                return (
                  <div key={part.id}>
                    <section
                      className="scroll-mt-28 px-5 py-6 sm:px-8 sm:py-7"
                      id={`part-${part.id}`}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '420px' }}
                    >
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            {question.parts.length > 1 ? (
                              <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                                  {index + 1}
                                </span>
                                Part {index + 1}
                              </div>
                            ) : null}

                            {part.richText ? (
                              <RichTextRenderer
                                className="text-base leading-8 text-foreground/90 sm:text-lg [&_p:last-child]:mb-0"
                                data={part.richText}
                              />
                            ) : question.parts.length > 1 ? null : (
                              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                                Choose the response that best matches your working, then review the
                                complete solution after submission.
                              </p>
                            )}
                          </div>

                          <Button
                            className={cn(
                              'shrink-0 rounded-full border px-3.5',
                              isFlagged
                                ? 'border-primary/25 bg-primary/10 text-foreground hover:bg-primary/15'
                                : 'border-border/70 bg-background/70 text-muted-foreground hover:text-foreground',
                            )}
                            onClick={() => {
                              setFlaggedPartIds((current) =>
                                current.includes(part.id)
                                  ? current.filter((flaggedPartId) => flaggedPartId !== part.id)
                                  : [...current, part.id],
                              )
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Flag className={cn('size-4', isFlagged && 'fill-current')} />
                            {isFlagged ? 'Flagged' : 'Flag'}
                          </Button>
                        </div>

                        <div className="rounded-[1.6rem] border border-border/70 bg-background/75 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:p-4 dark:bg-background/35 dark:shadow-none">
                          <div className="space-y-3 rounded-[1.2rem] border border-border/50 bg-card/80 p-3 sm:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">Your answer</p>
                                <p className="text-sm text-muted-foreground">
                                  {part.answerMechanism.type === 'multipleChoice'
                                    ? 'Pick one option. The entire question is checked in one submission.'
                                    : part.answerMechanism.type === 'freeTextValidation'
                                      ? 'Write your working clearly. You can still submit blank parts.'
                                      : 'Mark whether you solved this confidently before you review the model solution.'}
                                </p>
                              </div>

                              <Badge
                                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                variant="outline"
                              >
                                {answerTypeLabel(part.answerMechanism.type)}
                              </Badge>
                            </div>

                            <AnswerField
                              disabled={isSubmitted}
                              part={part}
                              response={response}
                              setResponse={(value) => {
                                setResponses((current) => ({ ...current, [part.id]: value }))
                                setIsSkipped(false)
                              }}
                            />
                          </div>
                        </div>

                        {review && result ? (
                          <QuestionReviewPanel
                            part={part}
                            response={response}
                            review={review}
                            result={result}
                          />
                        ) : null}
                      </div>
                    </section>

                    {index < question.parts.length - 1 ? (
                      <Separator className="bg-border/70" />
                    ) : null}
                  </div>
                )
              })}
            </article>

            <StickyActionBar
              answeredCount={answeredCount}
              footerPrimaryLabel={footerPrimaryLabel}
              isSaved={isSaved}
              isSkipped={isSkipped}
              isSubmitted={isSubmitted}
              nextQuestionLabel={reviewPayload.nextQuestionLabel}
              question={question}
              reviewSummary={reviewSummary}
              setIsSaved={setIsSaved}
              setIsSkipped={setIsSkipped}
            />
          </div>
        </div>
      </div>
    </form>
  )
}

type SessionHeaderProps = {
  activeAccuracyLabel: string
  answeredCount: number
  completionPercent: number
  flaggedCount: number
  isDraftMode: boolean
  question: Question
  reviewSummary: {
    accuracyPercent: number
    correctCount: number
    incorrectCount: number
    unansweredCount: number
  } | null
  sessionMeta: QuestionSessionMeta
}

const MobileSessionHeader = ({
  activeAccuracyLabel,
  answeredCount,
  completionPercent,
  flaggedCount,
  isDraftMode,
  question,
  reviewSummary,
  sessionMeta,
}: SessionHeaderProps) => {
  return (
    <section className="space-y-3 lg:hidden">
      <div className="rounded-[1.7rem] border border-border/70 bg-card/95 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-card/90">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
            {sessionMeta.attemptLabel}
          </Badge>
          <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="secondary">
            {sessionMeta.topicLabel}
          </Badge>
          {isDraftMode ? (
            <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
              Draft preview
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Study session</p>
            <p className="text-xl font-semibold text-foreground">Question {question.id}</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-right">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Accuracy
            </p>
            <p className="text-sm font-semibold text-foreground">{activeAccuracyLabel}</p>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={completionPercent}>
            <div className="flex w-full items-center gap-2">
              <ProgressLabel>Question progress</ProgressLabel>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {answeredCount + '/' + question.parts.length}
              </span>
            </div>
          </Progress>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <CompactStat icon={Clock3} label="Time" value={sessionMeta.timeSpentLabel} />
          <CompactStat icon={Flag} label="Flagged" value={String(flaggedCount)} />
          <CompactStat
            icon={Target}
            label="Review"
            value={reviewSummary ? `${reviewSummary.correctCount} ok` : 'Pending'}
          />
        </div>

        {question.parts.length > 1 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {question.parts.map((part, index) => (
              <a
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                href={`#part-${part.id}`}
                key={part.id}
              >
                <span className="text-muted-foreground">{index + 1}</span>
                Part {index + 1}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

const DesktopSessionRail = ({
  activeAccuracyLabel,
  answeredCount,
  completionPercent,
  flaggedCount,
  isDraftMode,
  question,
  reviewSummary,
  sessionMeta,
}: SessionHeaderProps) => {
  return (
    <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block lg:self-start">
      <div className="rounded-[1.9rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-card/90">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
            {sessionMeta.attemptLabel}
          </Badge>
          {isDraftMode ? (
            <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="secondary">
              Draft preview
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Study session</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Question {question.id}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Read, answer, review the worked methods, then continue.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <Progress value={completionPercent}>
            <div className="flex w-full items-center gap-2">
              <ProgressLabel>Question progress</ProgressLabel>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {answeredCount + '/' + question.parts.length}
              </span>
            </div>
          </Progress>

          <div className="grid gap-2.5 text-sm">
            <RailMetric icon={Layers3} label="Topic" value={sessionMeta.topicLabel} />
            <RailMetric icon={Target} label="Accuracy" value={activeAccuracyLabel} />
            <RailMetric icon={Flag} label="Flagged" value={`${flaggedCount} marked`} />
            <RailMetric icon={Clock3} label="Time spent" value={sessionMeta.timeSpentLabel} />
            <RailMetric
              icon={NotebookPen}
              label="Estimate"
              value={`${sessionMeta.estimatedMinutes} min`}
            />
          </div>
        </div>

        <Separator className="my-5 bg-border/70" />

        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Current focus
          </p>
          <div className="flex flex-wrap gap-2">
            {sessionMeta.aspectLabels.map((label) => (
              <Badge
                className="rounded-full px-3 py-1 text-xs font-medium"
                key={label}
                variant="outline"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {reviewSummary ? (
          <>
            <Separator className="my-5 bg-border/70" />
            <div className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                This question
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Correct</span>
                  <span className="font-semibold text-foreground">
                    {reviewSummary.correctCount}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Needs review</span>
                  <span className="font-semibold text-foreground">
                    {reviewSummary.incorrectCount}
                  </span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Blank</span>
                  <span className="font-semibold text-foreground">
                    {reviewSummary.unansweredCount}
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {question.parts.length > 1 ? (
        <div className="rounded-[1.7rem] border border-border/70 bg-card/95 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.28)] backdrop-blur dark:bg-card/90">
          <p className="px-1 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Question parts
          </p>
          <div className="mt-3 space-y-2">
            {question.parts.map((part, index) => (
              <a
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/65 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                href={`#part-${part.id}`}
                key={part.id}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p>Part {index + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    {answerTypeLabel(part.answerMechanism.type)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}

type QuestionHeaderProps = {
  answeredCount: number
  isDraftMode: boolean
  question: Question
  sessionMeta: QuestionSessionMeta
}

const QuestionHeader = ({
  answeredCount,
  isDraftMode,
  question,
  sessionMeta,
}: QuestionHeaderProps) => {
  const answerTypes = Array.from(
    new Set(question.parts.map((part) => answerTypeLabel(part.answerMechanism.type))),
  )

  return (
    <header className="space-y-6 border-b border-border/70 px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="outline">
          Question {question.id}
        </Badge>
        <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold" variant="secondary">
          {sessionMeta.topicLabel}
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
            {answeredCount} of {question.parts.length} parts touched
          </span>
        </div>

        <RichTextRenderer
          className="max-w-4xl text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9 [&_figure]:my-6 [&_figure]:overflow-hidden [&_figure]:rounded-[1.6rem] [&_figure]:border [&_figure]:border-border/70 [&_figure]:bg-background/80 [&_figure]:shadow-[0_20px_40px_-32px_rgba(15,23,42,0.38)] [&_img]:max-h-107.5 [&_img]:w-full [&_img]:object-contain [&_p:first-child]:text-[1.7rem] [&_p:first-child]:leading-[1.18] [&_p:first-child]:font-semibold [&_p:first-child]:tracking-tight sm:[&_p:first-child]:text-[2.35rem]"
          data={question.richText ?? null}
        />
      </div>
    </header>
  )
}

type AnswerFieldProps = {
  disabled: boolean
  part: Question['parts'][number]
  response: string | undefined
  setResponse: (value: string) => void
}

const AnswerField = ({ disabled, part, response, setResponse }: AnswerFieldProps) => {
  switch (part.answerMechanism.type) {
    case 'multipleChoice':
      return (
        <RadioGroup
          className="gap-3"
          onValueChange={(value) => setResponse(String(value))}
          value={response ?? ''}
        >
          {part.answerMechanism.choices.map((choice, index) => {
            const choiceId = `${part.id}-${choice.id}`
            const isSelected = response === choice.id

            return (
              <label
                className={cn(
                  'group flex cursor-pointer items-start gap-4 rounded-4xl border border-border/70 bg-background/80 px-4 py-4 transition-all hover:border-primary/35 hover:bg-primary/5',
                  isSelected &&
                    'border-primary/50 bg-primary/8 shadow-[0_12px_30px_-24px_rgba(16,185,129,0.75)]',
                  disabled && 'cursor-default opacity-85',
                )}
                htmlFor={choiceId}
                key={choice.id}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-sm font-semibold text-muted-foreground transition-colors group-hover:border-primary/35 group-hover:text-primary">
                  {getChoiceLetter(index)}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm leading-7 text-foreground sm:text-[15px]">{choice.text}</p>
                </div>

                <RadioGroupItem
                  className="mt-1"
                  disabled={disabled}
                  id={choiceId}
                  value={choice.id}
                />
              </label>
            )
          })}
        </RadioGroup>
      )
    case 'freeTextValidation':
      return (
        <Textarea
          className="min-h-32 rounded-[1.3rem] border-border/70 bg-background/85 px-4 py-3 text-base leading-7 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/45"
          disabled={disabled}
          onChange={(event) => setResponse(event.target.value)}
          placeholder="Type your final answer and any short supporting note"
          value={response ?? ''}
        />
      )
    case 'selfReport':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              description:
                'I solved it confidently and want to compare my working against the model solution.',
              label: 'I got this',
              value: 'correct',
            },
            {
              description:
                'I want to see the worked method and compare where my reasoning broke down.',
              label: 'Needs review',
              value: 'incorrect',
            },
          ].map((option) => {
            const isSelected = response === option.value

            return (
              <Button
                className={cn(
                  'h-auto rounded-4xl border px-4 py-4 text-left text-sm whitespace-normal',
                  isSelected
                    ? 'border-primary/50 bg-primary/10 text-foreground hover:bg-primary/12'
                    : 'border-border/70 bg-background/80 text-foreground hover:bg-accent',
                )}
                disabled={disabled}
                key={option.value}
                onClick={() => setResponse(option.value)}
                type="button"
                variant="outline"
              >
                <div className="space-y-1">
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{option.description}</p>
                </div>
              </Button>
            )
          })}
        </div>
      )
    default:
      return null
  }
}

type QuestionReviewPanelProps = {
  part: Question['parts'][number]
  response: string | undefined
  review: QuestionReviewPart
  result: PartResult
}

const QuestionReviewPanel = ({ part, response, review, result }: QuestionReviewPanelProps) => {
  return (
    <section className="rounded-[1.6rem] border border-border/70 bg-background/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
              result.accentClassName,
            )}
          >
            {result.status === 'correct' ? (
              <CheckCircle2 className="size-4" />
            ) : result.status === 'incorrect' ? (
              <CircleAlert className="size-4" />
            ) : (
              <SkipForward className="size-4" />
            )}
            {result.title}
          </div>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{result.body}</p>
        </div>

        {review.correctAnswerText ? (
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Correct answer
            </p>
            <p className="mt-1 font-medium text-foreground">{review.correctAnswerText}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.3rem] border border-border/70 bg-card/85 p-4">
        <p className="text-sm font-semibold text-foreground">Why this works</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{review.explanation}</p>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Worked solutions</p>
            <p className="text-sm text-muted-foreground">
              {response
                ? 'Compare your answer with the methods below.'
                : 'Use the methods below to rebuild the answer from scratch.'}
            </p>
          </div>
        </div>

        <Accordion className="border-border/70 bg-background/70" multiple>
          {review.solutionMethods.map((solutionMethod, index) => (
            <AccordionItem key={solutionMethod.id} value={solutionMethod.id}>
              <AccordionTrigger className="px-4 py-4 text-base font-semibold no-underline hover:no-underline">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p>{solutionMethod.title}</p>
                    <p className="mt-1 text-sm font-normal text-muted-foreground">
                      Method {index + 1} for {questionPartLabel(part)}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <RichTextRenderer
                  className="text-sm leading-7 text-foreground/85 [&_p:last-child]:mb-0"
                  data={solutionMethod.richText}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

type StickyActionBarProps = {
  answeredCount: number
  footerPrimaryLabel: string
  isSaved: boolean
  isSkipped: boolean
  isSubmitted: boolean
  nextQuestionLabel: string
  question: Question
  reviewSummary: {
    accuracyPercent: number
    correctCount: number
    incorrectCount: number
    unansweredCount: number
  } | null
  setIsSaved: React.Dispatch<React.SetStateAction<boolean>>
  setIsSkipped: React.Dispatch<React.SetStateAction<boolean>>
}

const StickyActionBar = ({
  answeredCount,
  footerPrimaryLabel,
  isSaved,
  isSkipped,
  isSubmitted,
  nextQuestionLabel,
  question,
  reviewSummary,
  setIsSaved,
  setIsSkipped,
}: StickyActionBarProps) => {
  const handleContinue = () => {
    // Future: navigate after the real submission response arrives with next-question context.
  }

  return (
    <div className="sticky bottom-3 z-20">
      <div className="rounded-[1.7rem] border border-border/80 bg-card/92 p-3 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:bg-card/88 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isSubmitted
                ? reviewSummary
                  ? `${reviewSummary.correctCount} of ${question.parts.length} parts ready to carry forward`
                  : 'Review ready'
                : 'Answer every part when you can, then check the whole question once'}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {isSubmitted
                ? `The next step can request fresh review data and navigate to ${nextQuestionLabel}.`
                : `${answeredCount} of ${question.parts.length} parts answered. Blank parts can still be submitted.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSaved ? (
              <Badge className="rounded-full px-3 py-1 text-xs font-semibold" variant="secondary">
                Saved to revisit
              </Badge>
            ) : null}
            {isSkipped ? (
              <Badge className="rounded-full px-3 py-1 text-xs font-semibold" variant="outline">
                Marked to skip for now
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-full"
              onClick={() => setIsSkipped((current) => !current)}
              type="button"
              variant="outline"
            >
              <SkipForward className="size-4" />
              Skip
            </Button>
            <Button
              className={cn(
                'rounded-full',
                isSaved && 'border-primary/35 bg-primary/10 text-foreground hover:bg-primary/15',
              )}
              onClick={() => setIsSaved((current) => !current)}
              type="button"
              variant="outline"
            >
              <Bookmark className={cn('size-4', isSaved && 'fill-current')} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              className="rounded-full px-5"
              onClick={isSubmitted ? handleContinue : undefined}
              type={isSubmitted ? 'button' : 'submit'}
            >
              {isSubmitted ? (
                <ArrowRight className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {footerPrimaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CompactStat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) => {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/75 px-3 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

const RailMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function evaluatePart(
  part: Question['parts'][number],
  response: string | undefined,
  review: QuestionReviewPart,
): PartResult {
  if (!response) {
    return {
      accentClassName: 'border border-border/70 bg-muted/70 text-foreground',
      body: 'You left this blank. Read the worked methods below, then compare them to how you would rebuild the answer next time.',
      status: 'unanswered',
      title: 'No answer submitted',
    }
  }

  switch (review.answerType) {
    case 'multipleChoice': {
      const selectedChoice =
        part.answerMechanism.type === 'multipleChoice'
          ? part.answerMechanism.choices.find((choice) => choice.id === response)
          : undefined

      if (review.correctChoiceId === response) {
        return {
          accentClassName: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
          body: 'You selected the best-supported option. Use the worked methods to confirm why the distractors fall away.',
          status: 'correct',
          title: 'Correct answer',
        }
      }

      return {
        accentClassName: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        body: selectedChoice
          ? `You chose "${selectedChoice.text}". Review the worked methods below to see which clue in the prompt should have ruled it out.`
          : 'Review the worked methods below to compare your selection with the strongest mathematical route.',
        status: 'incorrect',
        title: 'Needs review',
      }
    }
    case 'freeTextValidation':
      return normalizeAnswer(response) === normalizeAnswer(review.correctAnswerText)
        ? {
            accentClassName: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
            body: 'Your submitted response matches the expected answer format for this proof-of-concept review flow.',
            status: 'correct',
            title: 'Correct answer',
          }
        : {
            accentClassName: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
            body: 'Your final response does not match the expected answer yet. Compare your working against the structured method below.',
            status: 'incorrect',
            title: 'Needs review',
          }
    case 'selfReport':
      return response === 'correct'
        ? {
            accentClassName: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
            body: 'You marked this part as solved. Use the model solution as a final confidence check, especially for any skipped algebra or justification lines.',
            status: 'correct',
            title: 'Marked as solved',
          }
        : {
            accentClassName: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
            body: 'You marked this part for review. Read both worked methods and focus on where your reasoning diverged from the model solution.',
            status: 'incorrect',
            title: 'Marked for review',
          }
    default:
      return {
        accentClassName: 'border border-border/70 bg-muted/70 text-foreground',
        body: 'Review the worked solution below.',
        status: 'unanswered',
        title: 'Review available',
      }
  }
}

function hasResponse(value: string | undefined) {
  return Boolean(value && value.trim().length > 0)
}

function normalizeAnswer(value?: string) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function getChoiceLetter(index: number) {
  return String.fromCharCode(65 + index)
}

function answerTypeLabel(answerType: Question['parts'][number]['answerMechanism']['type']) {
  switch (answerType) {
    case 'multipleChoice':
      return 'Multiple choice'
    case 'freeTextValidation':
      return 'Written answer'
    case 'selfReport':
      return 'Self check'
    default:
      return 'Answer'
  }
}

function questionPartLabel(part: Question['parts'][number]) {
  return part.richText ? 'this part' : 'the question'
}
