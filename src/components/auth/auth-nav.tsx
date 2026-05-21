import Link from 'next/link'

import { logoutFormAction } from '@/app/actions/auth-actions'
import { hasRole, USER_ROLES } from '@/lib/auth/roles'
import type { User } from '@/payload/payload-types'

import { Button } from '../ui/button'
import { NavigationMenuItem, NavigationMenuLink } from '../ui/navigation-menu'

type AuthNavProps = {
  user: User | null
}

export function AuthNav({ user }: AuthNavProps) {
  if (!user) {
    return (
      <NavigationMenuItem>
        <NavigationMenuLink render={<Link href="/login" />}>Login</NavigationMenuLink>
      </NavigationMenuItem>
    )
  }

  return (
    <>
      {hasRole(user, USER_ROLES.admin) && (
        <NavigationMenuItem>
          <NavigationMenuLink render={<Link href="/admin" />}>Admin</NavigationMenuLink>
        </NavigationMenuItem>
      )}
      <NavigationMenuItem>
        <form action={logoutFormAction}>
          <Button type="submit" variant="ghost" size="sm" className="cursor-pointer">
            Logout
          </Button>
        </form>
      </NavigationMenuItem>
    </>
  )
}
