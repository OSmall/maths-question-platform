import Link from 'next/link'
import { Libre_Baskerville, Public_Sans } from 'next/font/google'
import {
  ArrowRight,
  BookOpenCheck,
  ChartSpline,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const display = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
})

const body = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})

const featureItems = [
  {
    icon: Target,
    title: 'Adaptive Question Paths',
    description:
      'Each learner gets focused question sets that adjust by topic confidence and response speed.',
  },
  {
    icon: ChartSpline,
    title: 'Clear Progress Signals',
    description:
      'Track mastery by strand with concise visual summaries students can actually act on.',
  },
  {
    icon: BookOpenCheck,
    title: 'Exam-Style Practice',
    description:
      'Build fluency with mixed-difficulty practice that mirrors timing, format, and mark schemes.',
  },
  {
    icon: ShieldCheck,
    title: 'Teacher-Ready Controls',
    description:
      'Assign, review, and intervene quickly with reliable submissions and easy moderation flows.',
  },
]

const stateItems = [
  {
    name: 'Loading',
    tone: 'bg-muted text-foreground ring-border',
    detail: 'Question packs stream in under clear skeleton states.',
  },
  {
    name: 'Empty',
    tone: 'bg-secondary text-secondary-foreground ring-border',
    detail: 'No results pages suggest the next best revision path.',
  },
  {
    name: 'Error',
    tone: 'bg-destructive/10 text-destructive ring-destructive/30',
    detail: 'Transient failures surface retry guidance, not dead ends.',
  },
  {
    name: 'Success',
    tone: 'bg-primary/10 text-primary ring-primary/30',
    detail: 'Completion confirms marks, feedback, and next-step goals.',
  },
]

export default function TestLandingPage() {
  return (
    <div className={`${display.variable} ${body.variable} bg-background text-foreground`}>
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-gradient-to-b from-background via-background/90 to-background" />
        <div className="pointer-events-none absolute -top-36 -left-24 -z-10 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-24 right-0 -z-10 size-[26rem] rounded-full bg-secondary/60 blur-3xl" />

        <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-12 lg:px-8">
          <header className="animate-in fade-in slide-in-from-top-2 duration-700">
            <Badge
              variant="outline"
              className="mb-6 bg-background/80 px-3 py-1 text-[0.7rem] tracking-[0.14em]"
            >
              ACADEMIC EDITORIAL DEMO
            </Badge>

            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <h1
                  className="max-w-2xl text-balance text-4xl leading-tight font-bold sm:text-5xl md:text-6xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Maths practice that feels rigorous, calm, and genuinely motivating.
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Support every learner with guided revision journeys, exam-style questions, and
                  transparent progress evidence that teachers can trust.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="h-11 rounded-full px-5"
                    render={<Link href="/question/1" />}
                    nativeButton={false}
                  >
                    Start a sample paper
                    <ArrowRight className="ml-1" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 rounded-full bg-background/80 px-5"
                    render={
                      <a
                        href="https://payloadcms.com/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    nativeButton={false}
                  >
                    View platform docs
                  </Button>
                </div>
              </div>

              <Card className="animate-in fade-in slide-in-from-right-3 duration-700 bg-card/90 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                    This week in revision
                  </CardTitle>
                  <CardDescription>
                    One glance for teachers. Clear momentum for students.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Attempt completion</p>
                      <p className="mt-1 text-2xl font-semibold">87%</p>
                    </div>
                    <div className="rounded-xl bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Avg. time/question</p>
                      <p className="mt-1 text-2xl font-semibold">52s</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-secondary/70 p-4 text-sm text-secondary-foreground">
                    142 learners improved algebra accuracy after targeted mixed sets this week.
                  </div>
                </CardContent>
              </Card>
            </div>
          </header>

          <section className="mt-12 animate-in fade-in slide-in-from-bottom-2 duration-700 sm:mt-16">
            <div className="grid gap-3 rounded-2xl border border-border bg-card/70 p-4 sm:grid-cols-3 sm:p-6">
              <div className="flex items-center gap-3 rounded-xl bg-muted/80 p-4">
                <GraduationCap className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Active learners</p>
                  <p className="text-lg font-semibold">12,000+</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/80 p-4">
                <Clock3 className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Weekly practice sessions</p>
                  <p className="text-lg font-semibold">48,500</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/80 p-4">
                <Sparkles className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Schools onboarded</p>
                  <p className="text-lg font-semibold">350</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-12 sm:mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2
                className="text-2xl font-bold sm:text-3xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Built for focused learning and confident teaching
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featureItems.map((item, index) => {
                const Icon = item.icon

                return (
                  <Card
                    key={item.title}
                    className="animate-in fade-in slide-in-from-bottom-2 bg-card/90 duration-700"
                    style={{ animationDelay: `${100 + index * 70}ms` }}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="rounded-full bg-primary/10 p-2 text-primary">
                          <Icon className="size-4" />
                        </span>
                        {item.title}
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </section>

          <section className="mt-12 sm:mt-16">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Reliable experience states
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Every user flow keeps momentum: clear progress while loading, guidance when nothing
              matches, safe retries on errors, and explicit confirmations on success.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stateItems.map((state) => (
                <div key={state.name} className="rounded-xl border border-border bg-card p-4">
                  <Badge className={`mb-3 ring-1 ${state.tone}`} variant="outline">
                    {state.name}
                  </Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">{state.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 sm:mt-16">
            <div className="rounded-2xl border border-border bg-secondary/60 p-6 sm:p-8">
              <h2
                className="text-2xl font-bold sm:text-3xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Ready to launch your next revision cohort?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Create structured assignments, monitor confidence by topic, and keep students in
                productive practice loops from week one.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="h-11 rounded-full px-5"
                  render={<Link href="/" />}
                  nativeButton={false}
                >
                  Go to homepage
                </Button>

                <Button
                  size="lg"
                  variant="ghost"
                  className="h-11 rounded-full px-5"
                  render={<Link href="/question/1" />}
                  nativeButton={false}
                >
                  Try a question now
                </Button>
              </div>
            </div>
          </section>

          <footer className="mt-12 sm:mt-16">
            <Separator className="bg-border" />
            <div className="flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:text-sm">
              <p>Academic Editorial demo for /test-landing-page</p>
              <div className="flex items-center gap-3">
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
                <Link href="/question/1" className="hover:text-foreground">
                  Sample question
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
