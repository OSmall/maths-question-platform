'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

const modes = ['dark', 'light', 'system'] as const

type ThemeMode = (typeof modes)[number]

function getNextMode(mode: ThemeMode): ThemeMode {
  const currentIndex = modes.indexOf(mode)
  const nextIndex = (currentIndex + 1) % modes.length

  return modes[nextIndex]
}

function getModeLabel(mode: ThemeMode): string {
  if (mode === 'dark') return 'Force dark'
  if (mode === 'light') return 'Force light'
  return 'Follow system'
}

const subscribeToMount = () => () => undefined
const getMountedSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeModeCycleButton() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribeToMount, getMountedSnapshot, getServerSnapshot)

  const currentMode = useMemo<ThemeMode>(() => {
    if (!mounted) return 'system'

    if (theme === 'dark' || theme === 'light' || theme === 'system') {
      return theme
    }

    return 'system'
  }, [mounted, theme])

  const nextMode = getNextMode(currentMode)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(nextMode)}
      aria-label={`Switch theme mode. Current: ${getModeLabel(currentMode)}. Next: ${getModeLabel(nextMode)}.`}
    >
      Theme: {getModeLabel(currentMode)}
    </Button>
  )
}
