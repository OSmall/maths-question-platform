import { DefaultListView } from '@payloadcms/ui'
import type { ListViewClientProps, ListViewServerProps } from 'payload'

import {
  buildInitialCoverageState,
  buildMatrixColumns,
  groupTaxonomyRows,
  type PersistedCoverageEntry,
  type SyllabusMatrixColumn,
} from '@/lib/syllabus-coverage/matrix'
import { SyllabusCoverageMatrix } from './syllabus-coverage-matrix'

export async function SyllabusCoverageListView(props: ListViewServerProps) {
  const view = typeof props.searchParams?.view === 'string' ? props.searchParams.view : undefined

  if (view === 'raw') {
    return <DefaultListView {...getDefaultListViewProps(props)} />
  }

  const [syllabusesResult, subTopicsResult, coverageResult] = await Promise.all([
    props.payload.find({
      collection: 'syllabus' as never,
      depth: 0,
      limit: 1000,
      pagination: false,
      select: {
        id: true,
        name: true,
      } as never,
    }),
    props.payload.find({
      collection: 'subTopic',
      depth: 1,
      limit: 1000,
      pagination: false,
      sort: 'name',
      select: {
        id: true,
        name: true,
        topic: true,
      },
    }),
    props.payload.find({
      collection: 'syllabusSubTopic' as never,
      depth: 0,
      limit: 5000,
      pagination: false,
    }),
  ])

  const syllabuses = buildMatrixColumns(
    syllabusesResult.docs
      .map((doc) => {
        const candidate = doc as { id?: number; name?: string | null }

        if (typeof candidate.id !== 'number' || typeof candidate.name !== 'string') {
          return null
        }

        return {
          id: candidate.id,
          name: candidate.name,
        } satisfies SyllabusMatrixColumn
      })
      .filter((doc) => doc !== null),
  )

  const taxonomyRows = subTopicsResult.docs
    .map((doc) => {
      const candidate = doc as {
        id?: number
        name?: string | null
        topic?: { id?: number; name?: string | null } | number | null
      }

      if (
        typeof candidate.id !== 'number' ||
        typeof candidate.name !== 'string' ||
        !candidate.topic ||
        typeof candidate.topic === 'number' ||
        typeof candidate.topic.id !== 'number' ||
        typeof candidate.topic.name !== 'string'
      ) {
        return null
      }

      return {
        topicId: candidate.topic.id,
        topicName: candidate.topic.name,
        subTopicId: candidate.id,
        subTopicName: candidate.name,
      }
    })
    .filter((row) => row !== null)

  const coverageEntries = coverageResult.docs
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
        typeof subTopicId !== 'number' ||
        typeof syllabusId !== 'number' ||
        (candidate.status !== 'included' && candidate.status !== 'assumedKnowledge')
      ) {
        return null
      }

      return {
        id: candidate.id,
        status: candidate.status,
        subTopicId,
        syllabusId,
      } satisfies PersistedCoverageEntry
    })
    .filter((entry) => entry !== null)

  return (
    <SyllabusCoverageMatrix
      createSyllabusHref="/admin/collections/syllabus/create"
      groupedTopics={groupTaxonomyRows(taxonomyRows)}
      initialCoverageState={Object.fromEntries(
        buildInitialCoverageState(coverageEntries).entries(),
      )}
      manageTaxonomyHref="/admin/collections/subTopic"
      syllabuses={syllabuses}
      totalCoverageRows={coverageEntries.length}
    />
  )
}

function getDefaultListViewProps(props: ListViewServerProps): ListViewClientProps {
  return {
    AfterList: props.AfterList,
    AfterListTable: props.AfterListTable,
    beforeActions: props.beforeActions,
    BeforeList: props.BeforeList,
    BeforeListTable: props.BeforeListTable,
    collectionSlug: props.collectionSlug,
    columnState: props.columnState,
    Description: props.Description,
    disableBulkDelete: props.disableBulkDelete,
    disableBulkEdit: props.disableBulkEdit,
    disableQueryPresets: props.disableQueryPresets,
    enableRowSelections: props.enableRowSelections,
    hasCreatePermission: props.hasCreatePermission,
    hasDeletePermission: props.hasDeletePermission,
    listMenuItems: props.listMenuItems,
    newDocumentURL: props.newDocumentURL,
    queryPreset: props.queryPreset,
    queryPresetPermissions: props.queryPresetPermissions,
    renderedFilters: props.renderedFilters,
    resolvedFilterOptions: props.resolvedFilterOptions,
    Table: props.Table,
    viewType: props.viewType,
  }
}

function extractRelationshipId(value: number | { id?: number | null } | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (value && typeof value === 'object' && typeof value.id === 'number') {
    return value.id
  }

  return undefined
}
