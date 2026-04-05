import { Button } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import type { ServerProps } from 'payload'

export function SyllabusCoverageViewToggleAction(props: ServerProps) {
  const adminRoute = props.payload.config.routes.admin
  const currentView =
    typeof props.searchParams?.view === 'string' ? props.searchParams.view : undefined
  const showingRawRows = currentView === 'raw'
  const collectionHref = formatAdminURL({
    adminRoute,
    path: '/collections/syllabusSubTopic',
  })

  return (
    <Button
      buttonStyle="primary"
      el="link"
      size="small"
      to={showingRawRows ? collectionHref : `${collectionHref}?view=raw`}
    >
      {showingRawRows ? 'Open coverage matrix' : 'View raw rows'}
    </Button>
  )
}
