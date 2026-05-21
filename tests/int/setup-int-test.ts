import { afterAll } from 'bun:test'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { createServer } from 'node:net'
import type { Migration } from 'payload'

const host = '127.0.0.1'
const port = await getAvailablePort()
const database = await PGlite.create('memory://maths-question-platform-int')
const server = new PGLiteSocketServer({
  db: database,
  host,
  port,
  maxConnections: 100, // PGLite only accepts 1 connection which makes the migration fail. Setting this to > 1 doesn't change the limitation of PGLite, but will mutliplex the connections.
})

await server.start()

process.env.APP_ENV = 'integration-test'
process.env.DATABASE_URL = `postgres://postgres@${host}:${port}/postgres`
process.env.NEXT_PUBLIC_PAYLOAD_URL = 'http://localhost:3000'
process.env.PAYLOAD_SECRET = 'integration-test-payload-secret'
process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_integrationtest_token'

// Integration tests run against the same checked-in migration history as deployed environments.
process.env.PAYLOAD_MIGRATING = 'true'

const [{ getPayload }, { default: config }, { migrations }] = await Promise.all([
  import('payload'),
  import('@payload-config'),
  import('@/migrations'),
])
const payload = await getPayload({ config })
await payload.db.migrate({ migrations: migrations as Migration[] })
delete process.env.PAYLOAD_MIGRATING

afterAll(async () => {
  await server.stop()
  await database.close()
})

async function getAvailablePort() {
  const server = createServer()

  return new Promise<number>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Could not determine PGlite test port.')))
        return
      }

      server.close(() => resolve(address.port))
    })
  })
}
