import { createSafeActionClient } from 'next-safe-action'

export const actionClient = createSafeActionClient({
  handleServerError() {
    return 'Unable to submit question answers.'
  },
})
