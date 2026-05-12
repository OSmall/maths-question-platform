import React from 'react'
import Link from 'next/link'
import '../globals.css'
import { ThemeModeCycleButton } from '@/components/theme/theme-mode-cycle-button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AuthNav } from '@/components/auth/auth-nav'
import { getCurrentPayloadUser } from '@/lib/auth/current-user'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const user = await getCurrentPayloadUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
            <nav
              aria-label="Primary"
              className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6"
            >
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink render={<Link href="/" />}>Home</NavigationMenuLink>
                  </NavigationMenuItem>
                  <AuthNav user={user} />
                </NavigationMenuList>
              </NavigationMenu>
              <ThemeModeCycleButton />
            </nav>
          </header>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
