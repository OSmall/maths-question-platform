import { uuidSchema, type UUID } from '@/lib/domain/uuid'

export const syllabusCoverageStatusValues = ['excluded', 'included', 'assumedKnowledge', 'optional'] as const

export type SyllabusCoverageStatus = (typeof syllabusCoverageStatusValues)[number]

export type PersistedSyllabusCoverageStatus = Exclude<SyllabusCoverageStatus, 'excluded'>

export type MatrixTaxonomyRow = {
  subTopicId: UUID
  subTopicName: string
  topicId: UUID
  topicName: string
}

export type TopicCoverageGroup = {
  topicId: UUID
  topicName: string
  subTopics: Array<{
    subTopicId: UUID
    subTopicName: string
  }>
}

export type SyllabusMatrixColumn = {
  id: UUID
  name: string
}

export type PersistedCoverageEntry = {
  id: UUID
  status: PersistedSyllabusCoverageStatus
  subTopicId: UUID
  syllabusId: UUID
}

export type MatrixCellKey = `${string}:${string}`

export type ChangedMatrixCell = {
  nextStatus: SyllabusCoverageStatus
  previousStatus: SyllabusCoverageStatus
  subTopicId: UUID
  syllabusId: UUID
}

export type CoverageMutationPlan = {
  create: Array<{
    status: PersistedSyllabusCoverageStatus
    subTopicId: UUID
    syllabusId: UUID
  }>
  delete: Array<{
    id: UUID
  }>
  update: Array<{
    id: UUID
    status: PersistedSyllabusCoverageStatus
  }>
}

export function buildMatrixCellKey(syllabusId: UUID, subTopicId: UUID): MatrixCellKey {
  return `${syllabusId}:${subTopicId}`
}

export function groupTaxonomyRows(rows: MatrixTaxonomyRow[]): TopicCoverageGroup[] {
  const groups = new Map<string, TopicCoverageGroup>()

  for (const row of [...rows].sort(compareTaxonomyRows)) {
    const existing = groups.get(row.topicId)

    if (existing) {
      existing.subTopics.push({
        subTopicId: row.subTopicId,
        subTopicName: row.subTopicName,
      })

      continue
    }

    groups.set(row.topicId, {
      topicId: row.topicId,
      topicName: row.topicName,
      subTopics: [
        {
          subTopicId: row.subTopicId,
          subTopicName: row.subTopicName,
        },
      ],
    })
  }

  return [...groups.values()]
}

export function buildMatrixColumns(columns: SyllabusMatrixColumn[]) {
  return [...columns].sort((left, right) => left.name.localeCompare(right.name))
}

export function buildInitialCoverageState(entries: PersistedCoverageEntry[]) {
  const state = new Map<MatrixCellKey, SyllabusCoverageStatus>()

  for (const entry of entries) {
    state.set(buildMatrixCellKey(entry.syllabusId, entry.subTopicId), entry.status)
  }

  return state
}

export function getCellStatus(
  state: Map<MatrixCellKey, SyllabusCoverageStatus>,
  syllabusId: UUID,
  subTopicId: UUID,
): SyllabusCoverageStatus {
  return state.get(buildMatrixCellKey(syllabusId, subTopicId)) ?? 'excluded'
}

export function diffCoverageStates(args: {
  currentState: Map<MatrixCellKey, SyllabusCoverageStatus>
  initialState: Map<MatrixCellKey, SyllabusCoverageStatus>
}) {
  const keys = new Set<MatrixCellKey>([...args.initialState.keys(), ...args.currentState.keys()])
  const changedCells: ChangedMatrixCell[] = []

  for (const key of keys) {
    const previousStatus = args.initialState.get(key) ?? 'excluded'
    const nextStatus = args.currentState.get(key) ?? 'excluded'

    if (previousStatus === nextStatus) {
      continue
    }

    const [rawSyllabusId, rawSubTopicId] = key.split(':')
    const syllabusId = uuidSchema.parse(rawSyllabusId)
    const subTopicId = uuidSchema.parse(rawSubTopicId)

    changedCells.push({
      previousStatus,
      nextStatus,
      syllabusId,
      subTopicId,
    })
  }

  return changedCells.sort((left, right) => {
    if (left.syllabusId !== right.syllabusId) {
      return left.syllabusId.localeCompare(right.syllabusId)
    }

    return left.subTopicId.localeCompare(right.subTopicId)
  })
}

export function planCoverageMutations(args: {
  changedCells: ChangedMatrixCell[]
  persistedEntries: PersistedCoverageEntry[]
}): CoverageMutationPlan {
  const persistedEntryByKey = new Map<MatrixCellKey, PersistedCoverageEntry>()

  for (const entry of args.persistedEntries) {
    persistedEntryByKey.set(buildMatrixCellKey(entry.syllabusId, entry.subTopicId), entry)
  }

  const mutationPlan: CoverageMutationPlan = {
    create: [],
    delete: [],
    update: [],
  }

  for (const cell of args.changedCells) {
    const persistedEntry = persistedEntryByKey.get(
      buildMatrixCellKey(cell.syllabusId, cell.subTopicId),
    )

    if (cell.nextStatus === 'excluded') {
      if (persistedEntry) {
        mutationPlan.delete.push({ id: persistedEntry.id })
      }

      continue
    }

    if (persistedEntry) {
      mutationPlan.update.push({
        id: persistedEntry.id,
        status: cell.nextStatus,
      })

      continue
    }

    mutationPlan.create.push({
      syllabusId: cell.syllabusId,
      subTopicId: cell.subTopicId,
      status: cell.nextStatus,
    })
  }

  return mutationPlan
}

function compareTaxonomyRows(left: MatrixTaxonomyRow, right: MatrixTaxonomyRow) {
  const topicComparison = left.topicName.localeCompare(right.topicName)

  if (topicComparison !== 0) {
    return topicComparison
  }

  return left.subTopicName.localeCompare(right.subTopicName)
}
