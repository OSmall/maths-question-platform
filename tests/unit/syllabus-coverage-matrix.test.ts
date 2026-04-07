import { describe, expect, it } from 'bun:test'

import {
  buildInitialCoverageState,
  buildMatrixCellKey,
  diffCoverageStates,
  groupTaxonomyRows,
  planCoverageMutations,
} from '@/lib/syllabus-coverage/matrix'

describe('syllabus coverage matrix helpers', () => {
  it('groups taxonomy rows by topic and sorts them alphabetically', () => {
    const groups = groupTaxonomyRows([
      { topicId: 2, topicName: 'Statistics', subTopicId: 20, subTopicName: 'Median' },
      { topicId: 1, topicName: 'Algebra', subTopicId: 10, subTopicName: 'Factorising' },
      { topicId: 2, topicName: 'Statistics', subTopicId: 21, subTopicName: 'Mean' },
    ])

    expect(groups).toEqual([
      {
        topicId: 1,
        topicName: 'Algebra',
        subTopics: [{ subTopicId: 10, subTopicName: 'Factorising' }],
      },
      {
        topicId: 2,
        topicName: 'Statistics',
        subTopics: [
          { subTopicId: 21, subTopicName: 'Mean' },
          { subTopicId: 20, subTopicName: 'Median' },
        ],
      },
    ])
  })

  it('diffs sparse coverage states against excluded-by-default cells', () => {
    const initialState = buildInitialCoverageState([
      {
        id: 1,
        status: 'included',
        subTopicId: 10,
        syllabusId: 1,
      },
    ])

    const currentState = new Map(initialState)
    currentState.set(buildMatrixCellKey(1, 10), 'assumedKnowledge')
    currentState.set(buildMatrixCellKey(2, 20), 'included')

    const changedCells = diffCoverageStates({ currentState, initialState })

    expect(changedCells).toEqual([
      {
        nextStatus: 'assumedKnowledge',
        previousStatus: 'included',
        subTopicId: 10,
        syllabusId: 1,
      },
      {
        nextStatus: 'included',
        previousStatus: 'excluded',
        subTopicId: 20,
        syllabusId: 2,
      },
    ])
  })

  it('plans create, update, and delete mutations from changed cells', () => {
    const mutationPlan = planCoverageMutations({
      changedCells: [
        {
          nextStatus: 'included',
          previousStatus: 'excluded',
          subTopicId: 20,
          syllabusId: 2,
        },
        {
          nextStatus: 'assumedKnowledge',
          previousStatus: 'included',
          subTopicId: 10,
          syllabusId: 1,
        },
        {
          nextStatus: 'excluded',
          previousStatus: 'included',
          subTopicId: 30,
          syllabusId: 3,
        },
      ],
      persistedEntries: [
        {
          id: 100,
          status: 'included',
          subTopicId: 10,
          syllabusId: 1,
        },
        {
          id: 101,
          status: 'included',
          subTopicId: 30,
          syllabusId: 3,
        },
      ],
    })

    expect(mutationPlan).toEqual({
      create: [
        {
          status: 'included',
          subTopicId: 20,
          syllabusId: 2,
        },
      ],
      delete: [{ id: 101 }],
      update: [
        {
          id: 100,
          status: 'assumedKnowledge',
        },
      ],
    })
  })
})
