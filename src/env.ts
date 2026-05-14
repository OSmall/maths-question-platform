import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const appEnvValues = ['local', 'test', 'integration-test', 'preview', 'production'] as const

/**
 * Application runtime environment.
 *
 * This schema is for the Next/Payload app process only. Do not import it from
 * tooling processes unless those processes should fail when the full app
 * runtime contract is not satisfied.
 */
export const env = createEnv({
  server: {
    APP_ENV: z.enum(appEnvValues),
    BLOB_READ_WRITE_TOKEN: z.string(),
    DATABASE_URL: z.url(),
    PAYLOAD_SECRET: z.string().min(1),
    VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  },
  client: {
    NEXT_PUBLIC_PAYLOAD_URL: z.url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_PAYLOAD_URL: process.env.NEXT_PUBLIC_PAYLOAD_URL,
  },
  emptyStringAsUndefined: true,
})

export type AppEnv = (typeof appEnvValues)[number]
