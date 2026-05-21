'use client'

import {
  PopupList,
  toast,
  useConfig,
  useDocumentInfo,
  useForm,
  useFormModified,
  useLocale,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import { useState } from 'react'

import {
  buildBlankQuestionDraftData,
  buildStarterQuestionDraftData,
  extractSubTopicIDs,
} from './question-authoring-utils'
import type { UUID } from '@/lib/domain/uuid'

export function QuestionSaveAndAddAnotherMenuItem() {
  const router = useRouter()
  const [isCreatingNextDraft, setIsCreatingNextDraft] = useState(false)
  const modified = useFormModified()
  const { submit, getDataByPath } = useForm()
  const {
    config: {
      routes: { admin: adminRoute, api },
      serverURL,
    },
  } = useConfig()
  const { code: locale } = useLocale()
  const { id, collectionSlug, uploadStatus } = useDocumentInfo()

  if (collectionSlug !== 'question' || !id) {
    return null
  }

  const handleClick = async () => {
    if (isCreatingNextDraft || uploadStatus === 'uploading') {
      return
    }

    setIsCreatingNextDraft(true)

    try {
      if (modified) {
        const action = `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale}&depth=0&fallback-locale=null&draft=true`
        const result = await submit({
          action,
          disableSuccessStatus: true,
          method: 'PATCH',
          overrides: {
            _status: 'draft',
          },
          skipValidation: true,
        })

        if (!result) {
          return
        }
      }

      const nextDraftID = await createNextQuestionDraft({
        api,
        collectionSlug,
        locale,
        subTopicIDs: extractSubTopicIDs(getDataByPath('subTopics')),
      })

      router.push(
        formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${nextDraftID}`,
        }),
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to create the next draft question.',
      )
    } finally {
      setIsCreatingNextDraft(false)
    }
  }

  return (
    <PopupList.Button
      disabled={isCreatingNextDraft || uploadStatus === 'uploading'}
      id="action-save-and-add-another"
      onClick={() => {
        void handleClick()
      }}
    >
      Save and add another
    </PopupList.Button>
  )
}

async function createNextQuestionDraft({
  api,
  collectionSlug,
  locale,
  subTopicIDs,
}: {
  api: string
  collectionSlug: string
  locale: string
  subTopicIDs: UUID[]
}) {
  const createURL = `${api}/${collectionSlug}?${new URLSearchParams({
    depth: '0',
    draft: 'true',
    'fallback-locale': 'null',
    locale,
  }).toString()}`

  const blankDraftResult = await createQuestionDraft(
    createURL,
    locale,
    buildBlankQuestionDraftData(subTopicIDs),
  )

  if (blankDraftResult.ok) {
    return blankDraftResult.id
  }

  const starterDraftResult = await createQuestionDraft(
    createURL,
    locale,
    buildStarterQuestionDraftData(subTopicIDs),
  )

  if (starterDraftResult.ok) {
    return starterDraftResult.id
  }

  throw new Error(starterDraftResult.message ?? blankDraftResult.message)
}

async function createQuestionDraft(
  createURL: string,
  locale: string,
  data: ReturnType<typeof buildBlankQuestionDraftData>,
) {
  const response = await fetch(createURL, {
    body: JSON.stringify(data),
    credentials: 'include',
    headers: {
      'Accept-Language': locale,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  const payload = (await parseJSONResponse(response)) as
    | {
        doc?: { id?: string }
        errors?: Array<{ message?: string }>
        id?: string
        message?: string
      }
    | undefined
  const createdID = payload?.doc?.id ?? payload?.id

  if (response.ok && typeof createdID === 'string') {
    return {
      id: createdID,
      ok: true as const,
    }
  }

  return {
    message:
      payload?.message ??
      payload?.errors?.[0]?.message ??
      `Unable to create a draft question (${response.status}).`,
    ok: false as const,
  }
}

async function parseJSONResponse(response: Response) {
  const contentType = response.headers.get('content-type')

  if (!contentType || !contentType.includes('application/json')) {
    return undefined
  }

  return response.json()
}
