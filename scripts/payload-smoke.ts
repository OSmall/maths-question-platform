import { getPayload } from 'payload'

import config from '@payload-config'

import { smokeFixtures } from './payload-smoke/fixtures/index'
import type { ExpectedPayloadIdType, SmokeContext } from './payload-smoke/types'

const expectedPayloadIdType: ExpectedPayloadIdType = 'uuid'

const marker = `payload-smoke-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`

const payload = await getPayload({ config })
const context: SmokeContext = {
  expectedPayloadIdType,
  marker,
  payload,
  records: {},
}

console.log(`Starting Payload smoke test with marker ${marker}`)
console.log(`Expected root Payload ID type: ${expectedPayloadIdType}`)

for (const fixture of smokeFixtures) {
  console.log(`Creating ${fixture.name} fixture`)
  await fixture.create(context)

  console.log(`Verifying ${fixture.name} fixture`)
  await fixture.verify(context)
}

console.log('Payload smoke test passed')
