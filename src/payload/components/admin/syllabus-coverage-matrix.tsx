'use client'

import { Button, StickyToolbar, toast } from '@payloadcms/ui'
import Link from 'next/link'
import { useAction } from 'next-safe-action/hooks'
import { useEffect, useMemo, useState } from 'react'

import { saveSyllabusCoverageAction } from '@/app/actions/syllabus-coverage-actions'
import {
  buildMatrixCellKey,
  diffCoverageStates,
  type MatrixCellKey,
  type SyllabusCoverageStatus,
  type SyllabusMatrixColumn,
  type TopicCoverageGroup,
} from '@/lib/syllabus-coverage/matrix'

type CoverageStateRecord = Record<string, SyllabusCoverageStatus>

type Props = {
  createSyllabusHref: string
  groupedTopics: TopicCoverageGroup[]
  initialCoverageState: CoverageStateRecord
  manageTaxonomyHref: string
  syllabuses: SyllabusMatrixColumn[]
  totalCoverageRows: number
}

const controlOptions: Array<{ label: string; value: SyllabusCoverageStatus }> = [
  { label: 'Excl', value: 'excluded' },
  { label: 'Incl', value: 'included' },
  { label: 'Assumed', value: 'assumedKnowledge' },
]

export function SyllabusCoverageMatrix(props: Props) {
  const [coverageState, setCoverageState] = useState<CoverageStateRecord>(
    props.initialCoverageState,
  )
  const [baselineState, setBaselineState] = useState<CoverageStateRecord>(
    props.initialCoverageState,
  )
  const [collapsedTopicIds, setCollapsedTopicIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    setCoverageState(props.initialCoverageState)
    setBaselineState(props.initialCoverageState)
  }, [props.initialCoverageState])

  const changedCells = useMemo(
    () =>
      diffCoverageStates({
        currentState: new Map(Object.entries(coverageState)) as Map<
          MatrixCellKey,
          SyllabusCoverageStatus
        >,
        initialState: new Map(Object.entries(baselineState)) as Map<
          MatrixCellKey,
          SyllabusCoverageStatus
        >,
      }),
    [baselineState, coverageState],
  )

  const changedCellKeys = useMemo(
    () => new Set(changedCells.map((cell) => buildMatrixCellKey(cell.syllabusId, cell.subTopicId))),
    [changedCells],
  )

  const hasUnsavedChanges = changedCells.length > 0

  const saveAction = useAction(saveSyllabusCoverageAction, {
    onError: ({ error }) => {
      const message = error.serverError ?? 'Unable to save syllabus coverage.'
      toast.error(message)
    },
    onSuccess: ({ data }) => {
      setBaselineState(coverageState)
      toast.success(data.savedCount === 0 ? 'No changes to save.' : 'Coverage saved.')
    },
  })

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a[href]')

      if (!anchor) {
        return
      }

      const href = anchor.getAttribute('href')

      if (!href || href.startsWith('#') || anchor.getAttribute('target') === '_blank') {
        return
      }

      if (!window.confirm('You have unsaved coverage changes. Leave this page?')) {
        event.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [hasUnsavedChanges])

  function updateCellStatus(
    syllabusId: number,
    subTopicId: number,
    status: SyllabusCoverageStatus,
  ) {
    setCoverageState((currentState) => {
      const nextState = { ...currentState }
      const key = buildMatrixCellKey(syllabusId, subTopicId)

      if (status === 'excluded') {
        delete nextState[key]
        return nextState
      }

      nextState[key] = status
      return nextState
    })
  }

  function discardChanges() {
    if (!hasUnsavedChanges) {
      return
    }

    if (!window.confirm('Discard all unsaved coverage changes?')) {
      return
    }

    setCoverageState(baselineState)
  }

  function toggleTopic(topicId: number) {
    setCollapsedTopicIds((current) => {
      const next = new Set(current)

      if (next.has(topicId)) {
        next.delete(topicId)
      } else {
        next.add(topicId)
      }

      return next
    })
  }

  function saveChanges() {
    saveAction.execute({
      changes: changedCells.map((cell) => ({
        nextStatus: cell.nextStatus,
        subTopicId: cell.subTopicId,
        syllabusId: cell.syllabusId,
      })),
    })
  }

  const noSyllabuses = props.syllabuses.length === 0
  const noSubTopics = props.groupedTopics.length === 0

  return (
    <div className="syllabus-coverage-view">
      <div className="syllabus-coverage-header">
        <div>
          <h1>Syllabus Coverage</h1>
          <p>
            Edit coverage across {props.syllabuses.length} syllabuses and {props.totalCoverageRows}{' '}
            stored mappings.
          </p>
        </div>
      </div>

      {hasUnsavedChanges ? (
        <p className="syllabus-coverage-dirty">{changedCells.length} unsaved coverage changes</p>
      ) : (
        <p className="syllabus-coverage-clean">Coverage is up to date.</p>
      )}

      <div className="syllabus-coverage-table-wrap">
        <table className="syllabus-coverage-table">
          <thead>
            <tr>
              <th className="syllabus-coverage-table__sticky syllabus-coverage-table__sticky--header syllabus-coverage-table__sticky--first-column">
                {noSubTopics ? (
                  <Link className="syllabus-coverage-link" href={props.manageTaxonomyHref}>
                    Create topic and subtopic taxonomy
                  </Link>
                ) : (
                  'Subtopics'
                )}
                {/* // todo figure out why this is not sticky */}
              </th>

              {noSyllabuses ? (
                <th className="syllabus-coverage-table__sticky syllabus-coverage-table__sticky--header">
                  <Link className="syllabus-coverage-link" href={props.createSyllabusHref}>
                    Create a syllabus
                  </Link>
                </th>
              ) : (
                props.syllabuses.map((syllabus) => (
                  <th
                    className="syllabus-coverage-table__sticky syllabus-coverage-table__sticky--header"
                    key={syllabus.id}
                  >
                    {syllabus.name}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {props.groupedTopics.map((topic) => {
              const isCollapsed = collapsedTopicIds.has(topic.topicId)

              return (
                <FragmentTopicSection
                  changedCellKeys={changedCellKeys}
                  coverageState={coverageState}
                  isCollapsed={isCollapsed}
                  key={topic.topicId}
                  onToggle={() => toggleTopic(topic.topicId)}
                  onUpdateCellStatus={updateCellStatus}
                  syllabuses={props.syllabuses}
                  topic={topic}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {hasUnsavedChanges ? (
        <StickyToolbar>
          <div className="syllabus-coverage-toolbar-actions">
            <Button
              buttonStyle="secondary"
              disabled={saveAction.isExecuting}
              onClick={discardChanges}
            >
              Discard changes
            </Button>
            <Button buttonStyle="primary" disabled={saveAction.isExecuting} onClick={saveChanges}>
              {saveAction.isExecuting ? 'Saving coverage...' : 'Save coverage'}
            </Button>
          </div>
        </StickyToolbar>
      ) : null}
    </div>
  )
}

function FragmentTopicSection(props: {
  changedCellKeys: Set<string>
  coverageState: CoverageStateRecord
  isCollapsed: boolean
  onToggle: () => void
  onUpdateCellStatus: (
    syllabusId: number,
    subTopicId: number,
    status: SyllabusCoverageStatus,
  ) => void
  syllabuses: SyllabusMatrixColumn[]
  topic: TopicCoverageGroup
}) {
  return (
    <>
      <tr className="syllabus-coverage-topic-row">
        <th
          className="syllabus-coverage-table__sticky syllabus-coverage-table__sticky--first-column"
          colSpan={1}
        >
          <button className="syllabus-coverage-topic-toggle" onClick={props.onToggle} type="button">
            <span>{props.isCollapsed ? '+' : '-'}</span>
            <span>{props.topic.topicName}</span>
          </button>
        </th>
        {props.syllabuses.map((syllabus) => (
          <td key={syllabus.id} />
        ))}
      </tr>

      {!props.isCollapsed
        ? props.topic.subTopics.map((subTopic) => (
          <tr key={subTopic.subTopicId}>
            <th className="syllabus-coverage-table__sticky syllabus-coverage-table__sticky--first-column syllabus-coverage-subtopic-cell">
              {subTopic.subTopicName}
            </th>

            {props.syllabuses.map((syllabus) => {
              const cellKey = buildMatrixCellKey(syllabus.id, subTopic.subTopicId)
              const status = props.coverageState[cellKey] ?? 'excluded'
              const isChanged = props.changedCellKeys.has(cellKey)

              return (
                <td
                  className={
                    isChanged
                      ? 'syllabus-coverage-cell syllabus-coverage-cell--changed'
                      : 'syllabus-coverage-cell'
                  }
                  key={cellKey}
                >
                  <div className="syllabus-coverage-segmented-control" role="group">
                    {controlOptions.map((option) => (
                      <button
                        aria-pressed={status === option.value}
                        className={
                          status === option.value
                            ? 'syllabus-coverage-segmented-control__button syllabus-coverage-segmented-control__button--active'
                            : 'syllabus-coverage-segmented-control__button'
                        }
                        key={option.value}
                        onClick={() =>
                          props.onUpdateCellStatus(syllabus.id, subTopic.subTopicId, option.value)
                        }
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </td>
              )
            })}
          </tr>
        ))
        : null}
    </>
  )
}
