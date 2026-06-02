import { createSafeActionClient } from 'next-safe-action'

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error('Server action failed:', error)
    return 'Unable to complete action.'
  },
})
