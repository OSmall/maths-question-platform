import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import type { Question } from '@/lib/domain/question'

import { QuestionStudyExperience } from './question-study-experience'
import type { QuestionReviewPayload, QuestionSessionMeta } from './question-study-types'

type QuestionRendererProps = {
  isDraftMode?: boolean
  question: Question
}

const topicPool = ['Algebra', 'Functions', 'Geometry', 'Statistics', 'Proof', 'Problem Solving']

export const QuestionRenderer = ({ isDraftMode = false, question }: QuestionRendererProps) => {
  const sessionMeta = buildSessionMeta(question)

  return (
    <QuestionStudyExperience
      isDraftMode={isDraftMode}
      question={question}
      reviewPayload={buildMockReviewPayload(question)}
      sessionMeta={sessionMeta}
    />
  )
}

function buildSessionMeta(question: Question): QuestionSessionMeta {
  const sessionProgressCurrent = ((question.id + question.parts.length) % 8) + 4
  const sessionProgressTotal = Math.max(sessionProgressCurrent + 7, 20)
  const topicIndex = question.id % topicPool.length
  const aspectLabels = [
    topicPool[topicIndex],
    topicPool[(topicIndex + 2) % topicPool.length],
    question.parts.length > 1 ? 'Multi-step reasoning' : 'Single-step recall',
  ]

  return {
    attemptLabel: `Attempt #${((question.id + 6) % 9) + 1}`,
    estimatedMinutes: Math.max(4, question.parts.length * 3),
    aspectLabels,
    sessionAccuracyPercent: 84,
    sessionFlaggedCount: question.parts.length > 1 ? 1 : 0,
    sessionProgressCurrent,
    sessionProgressTotal,
    timeSpentLabel: `${String(question.parts.length + 5).padStart(2, '0')}:${String((question.id * 7) % 60).padStart(2, '0')}`,
    topicLabel: topicPool[topicIndex],
  }
}

function buildMockReviewPayload(question: Question): QuestionReviewPayload {
  return {
    nextQuestionLabel: `Question ${question.id + 1}`,
    parts: Object.fromEntries(
      question.parts.map((part, index) => {
        const partNumber = index + 1

        switch (part.answerMechanism.type) {
          case 'multipleChoice': {
            const correctChoice =
              part.answerMechanism.choices[index % part.answerMechanism.choices.length]

            return [
              part.id,
              {
                answerType: part.answerMechanism.type,
                correctAnswerText: correctChoice?.text,
                correctChoiceId: correctChoice?.id,
                explanation:
                  'Start by identifying the most direct mathematical relationship, then rule out distractors that only match part of the information in the prompt.',
                solutionMethods: [
                  {
                    id: `${part.id}-direct`,
                    richText: createMockRichText([
                      `Method 1 focuses on the key signal in part ${partNumber}. Translate the wording into a concrete mathematical rule before comparing the options.`,
                      'Once the rule is clear, substitute or estimate each option quickly. The correct choice is the only one that stays consistent all the way through the prompt.',
                    ]),
                    title: 'Direct method',
                  },
                  {
                    id: `${part.id}-elimination`,
                    richText: createMockRichText([
                      'Method 2 uses elimination. Remove any option that breaks a constraint from the question stem, even if it looks plausible at first glance.',
                      'This is useful under timed conditions because you can reduce the field quickly and then verify the final remaining option.',
                    ]),
                    title: 'Elimination check',
                  },
                ],
              },
            ]
          }
          case 'freeTextValidation':
            return [
              part.id,
              {
                answerType: part.answerMechanism.type,
                correctAnswerText: `Sample response ${partNumber}`,
                explanation:
                  'Show the intermediate step that links the question information to your final expression or value. In the real flow, this answer key should only come back after submission.',
                solutionMethods: [
                  {
                    id: `${part.id}-structured`,
                    richText: createMockRichText([
                      `Method 1 breaks part ${partNumber} into a setup line, a working line, and a final answer line so students can see the reasoning clearly.`,
                      'This keeps algebraic slips visible and makes marking easier when you compare the submitted answer with the canonical one.',
                    ]),
                    title: 'Structured working',
                  },
                ],
              },
            ]
          case 'selfReport':
            return [
              part.id,
              {
                answerType: part.answerMechanism.type,
                explanation:
                  'Self-reported parts are best followed by worked methods and reflective prompts so students can compare their reasoning against a model solution.',
                solutionMethods: [
                  {
                    id: `${part.id}-model`,
                    richText: createMockRichText([
                      `Method 1 gives a concise model solution for part ${partNumber}. Students can compare their own process with the target reasoning.`,
                      'In production, this content should come from the part solutionMethods array after the user submits their answer.',
                    ]),
                    title: 'Model solution',
                  },
                  {
                    id: `${part.id}-common-errors`,
                    richText: createMockRichText([
                      'Method 2 highlights a common pitfall and shows how to catch it early. This is especially useful when students mark themselves incorrect.',
                    ]),
                    title: 'Common error check',
                  },
                ],
              },
            ]
          default:
            return [part.id, undefined]
        }
      }),
    ) as QuestionReviewPayload['parts'],
  }
}

function createMockRichText(paragraphs: string[]): SerializedEditorState {
  return {
    root: {
      children: paragraphs.map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph,
            type: 'text',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        type: 'paragraph',
        version: 1,
      })),
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as SerializedEditorState
}
