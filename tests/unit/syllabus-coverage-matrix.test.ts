import { describe, expect, it } from 'bun:test'

import {
  buildInitialCoverageState,
  buildMatrixCellKey,
  diffCoverageStates,
  groupTaxonomyRows,
  planCoverageMutations,
} from '@/lib/syllabus-coverage/matrix'
import { parseUUID } from '@/lib/domain/uuid'

const topicAlgebra = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a07')
const topicStatistics = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a08')
const subTopicFactorising = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a09')
const subTopicMedian = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a10')
const subTopicMean = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a11')
const subTopicOther = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a12')
const syllabusOne = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a13')
const syllabusTwo = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a14')
const syllabusThree = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a15')
const coverageOne = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a16')
const coverageTwo = parseUUID('018f5f53-5c65-7a29-9b8d-9f8f9b9f9a17')

describe('syllabus coverage matrix helpers', () => {
  it('groups taxonomy rows by topic and sorts them alphabetically', () => {
    const groups = groupTaxonomyRows([
      { topicId: topicStatistics, topicName: 'Statistics', subTopicId: subTopicMedian, subTopicName: 'Median' },
      { topicId: topicAlgebra, topicName: 'Algebra', subTopicId: subTopicFactorising, subTopicName: 'Factorising' },
      { topicId: topicStatistics, topicName: 'Statistics', subTopicId: subTopicMean, subTopicName: 'Mean' },
    ])

    expect(groups).toEqual([
      {
        topicId: topicAlgebra,
        topicName: 'Algebra',
        subTopics: [{ subTopicId: subTopicFactorising, subTopicName: 'Factorising' }],
      },
      {
        topicId: topicStatistics,
        topicName: 'Statistics',
        subTopics: [
          { subTopicId: subTopicMean, subTopicName: 'Mean' },
          { subTopicId: subTopicMedian, subTopicName: 'Median' },
        ],
      },
    ])
  })

  it('diffs sparse coverage states against excluded-by-default cells', () => {
    const initialState = buildInitialCoverageState([
      {
        id: coverageOne,
        status: 'included',
        subTopicId: subTopicFactorising,
        syllabusId: syllabusOne,
      },
    ])

    const currentState = new Map(initialState)
    currentState.set(buildMatrixCellKey(syllabusOne, subTopicFactorising), 'assumedKnowledge')
    currentState.set(buildMatrixCellKey(syllabusTwo, subTopicMedian), 'included')
    currentState.set(buildMatrixCellKey(syllabusThree, subTopicMean), 'optional')

    const changedCells = diffCoverageStates({ currentState, initialState })

    expect(changedCells).toEqual([
      {
        nextStatus: 'assumedKnowledge',
        previousStatus: 'included',
        subTopicId: subTopicFactorising,
        syllabusId: syllabusOne,
      },
      {
        nextStatus: 'included',
        previousStatus: 'excluded',
        subTopicId: subTopicMedian,
        syllabusId: syllabusTwo,
      },
      {
        nextStatus: 'optional',
        previousStatus: 'excluded',
        subTopicId: subTopicMean,
        syllabusId: syllabusThree,
      },
    ])
  })

  it('plans create, update, and delete mutations from changed cells', () => {
    const mutationPlan = planCoverageMutations({
      changedCells: [
        {
          nextStatus: 'included',
          previousStatus: 'excluded',
          subTopicId: subTopicMedian,
          syllabusId: syllabusTwo,
        },
        {
          nextStatus: 'optional',
          previousStatus: 'included',
          subTopicId: subTopicFactorising,
          syllabusId: syllabusOne,
        },
        {
          nextStatus: 'excluded',
          previousStatus: 'included',
          subTopicId: subTopicOther,
          syllabusId: syllabusThree,
        },
      ],
      persistedEntries: [
        {
          id: coverageOne,
          status: 'included',
          subTopicId: subTopicFactorising,
          syllabusId: syllabusOne,
        },
        {
          id: coverageTwo,
          status: 'included',
          subTopicId: subTopicOther,
          syllabusId: syllabusThree,
        },
      ],
    })

    expect(mutationPlan).toEqual({
      create: [
        {
          status: 'included',
          subTopicId: subTopicMedian,
          syllabusId: syllabusTwo,
        },
      ],
      delete: [{ id: coverageTwo }],
      update: [
        {
          id: coverageOne,
          status: 'optional',
        },
      ],
    })
  })
})
