'use server'

import { headers } from 'next/headers'
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
} from 'payload'
import { z } from 'zod'

import { planCoverageMutations, syllabusCoverageStatusValues } from '@/lib/syllabus-coverage/matrix'
import { actionClient } from '@/lib/safe-action'
import config from '@payload-config'

const changedCellSchema = z.object({
  nextStatus: z.enum(syllabusCoverageStatusValues),
  subTopicId: z.number().int().positive(),
  syllabusId: z.number().int().positive(),
})

const saveSyllabusCoverageSchema = z.object({
  changes: z.array(changedCellSchema),
})

export const saveSyllabusCoverageAction = actionClient
  .inputSchema(saveSyllabusCoverageSchema)
  .action(async ({ parsedInput }) => {
    if (parsedInput.changes.length === 0) {
      return { savedCount: 0 }
    }

    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const authResult = await payload.auth({ headers: requestHeaders })

    if (!authResult.user) {
      throw new Error('You must be signed in to update syllabus coverage.')
    }

    const req = await createLocalReq({ user: authResult.user }, payload)
    const shouldCommit = await initTransaction(req)

    try {
      const existingCoverage = await req.payload.find({
        collection: 'syllabusSubTopic' as never,
        depth: 0,
        limit: 5000,
        pagination: false,
        req,
      })

      const relevantEntries = existingCoverage.docs
        .map((doc) => {
          const candidate = doc as {
            id?: number
            status?: 'assumedKnowledge' | 'included'
            subTopic?: number | { id?: number | null } | null
            syllabus?: number | { id?: number | null } | null
          }

          const subTopicId = extractRelationshipId(candidate.subTopic)
          const syllabusId = extractRelationshipId(candidate.syllabus)

          if (
            typeof candidate.id !== 'number' ||
            typeof syllabusId !== 'number' ||
            typeof subTopicId !== 'number' ||
            (candidate.status !== 'included' && candidate.status !== 'assumedKnowledge')
          ) {
            return null
          }

          return {
            id: candidate.id,
            status: candidate.status,
            subTopicId,
            syllabusId,
          }
        })
        .filter((entry) => entry !== null)

      const mutationPlan = planCoverageMutations({
        changedCells: parsedInput.changes.map((change) => ({
          ...change,
          previousStatus: 'excluded',
        })),
        persistedEntries: relevantEntries,
      })

      for (const entry of mutationPlan.create) {
        await req.payload.create({
          collection: 'syllabusSubTopic' as never,
          data: {
            status: entry.status,
            subTopic: entry.subTopicId,
            syllabus: entry.syllabusId,
          } as never,
          req,
        })
      }

      for (const entry of mutationPlan.update) {
        await req.payload.update({
          collection: 'syllabusSubTopic' as never,
          id: entry.id,
          data: {
            status: entry.status,
          } as never,
          req,
        })
      }

      for (const entry of mutationPlan.delete) {
        await req.payload.delete({
          collection: 'syllabusSubTopic' as never,
          id: entry.id,
          req,
        })
      }

      if (shouldCommit) {
        await commitTransaction(req)
      }

      return { savedCount: parsedInput.changes.length }
    } catch (error) {
      if (shouldCommit) {
        await killTransaction(req)
      }

      throw error
    }
  })

function extractRelationshipId(value: number | { id?: number | null } | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value === 'object' && typeof value.id === 'number') {
    return value.id
  }

  return undefined
}
