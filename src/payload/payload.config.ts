import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from '@/payload/collections/users'
import { Media } from '@/payload/collections/media'
import { Question } from '@/payload/collections/question'
import { Syllabus } from '@/payload/collections/syllabus'
import { SyllabusSubTopic } from '@/payload/collections/syllabus-sub-topic'
import { StudySession } from '@/payload/collections/study-session'
import { Topic } from '@/payload/collections/topic'
import { SubTopic } from '@/payload/collections/sub-topic'
import { env } from '@/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Topic, SubTopic, Syllabus, SyllabusSubTopic, Question, StudySession],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    idType: 'uuidv7',
    pool: {
      connectionString: env.DATABASE_URL,
    },
    push: false,
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      token: env.BLOB_READ_WRITE_TOKEN,
      collections: {
        media: true,
      },
    }),
  ],
})
