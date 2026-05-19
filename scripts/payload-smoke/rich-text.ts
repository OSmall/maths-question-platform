import type { Question } from '@/payload/payload-types'

type RichText = NonNullable<Question['prompt']>

export function richText(text: string): RichText {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}
