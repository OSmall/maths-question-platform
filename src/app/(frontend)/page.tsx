import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      {/* Main Content */}
      <div className="flex flex-col items-center justify-center grow">
        <Image
          alt="Payload Logo"
          height={65}
          width={65}
          src="/payload-logo.svg"
          className="dark:invert"
        />
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center my-6 md:my-10">
          {!user && 'Welcome to your new project.'}
          {user && `Welcome back, ${user.email}`}
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            render={<Link href={payloadConfig.routes.admin} target="_blank" />}
            nativeButton={false}
          >
            Go to admin panel
          </Button>
          <Button
            render={
              <a href="https://payloadcms.com/docs" target="_blank" rel="noopener noreferrer" />
            }
            nativeButton={false}
          >
            Documentation
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row items-center gap-2 text-sm text-muted-foreground">
        <p>Update this page by editing</p>
        <a
          href={fileURL}
          className="px-2 py-0.5 bg-muted rounded text-foreground font-mono text-sm hover:bg-muted/80 transition-colors"
        >
          <code>app/(frontend)/page.tsx</code>
        </a>
      </footer>
    </div>
  )
}
