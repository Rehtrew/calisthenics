import { useSyncExternalStore } from 'react'
import { getState } from './store'
import type { ProgramId } from './types'

export type Route =
  | { name: 'home' }
  | { name: 'setup'; dayId: string }
  | { name: 'day'; programId: ProgramId; levelIndex: number; dayId: string }
  | { name: 'program' }
  | { name: 'workout' }
  | { name: 'summary'; sessionId: string }
  | { name: 'session'; sessionId: string }
  | { name: 'history' }
  | { name: 'settings' }

const initial: Route = getState().active ? { name: 'workout' } : { name: 'home' }

let route: Route = (history.state?.route as Route | undefined) ?? initial
history.replaceState({ route }, '')

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

window.addEventListener('popstate', (e) => {
  route = (e.state?.route as Route | undefined) ?? { name: 'home' }
  emit()
})

export function navigate(next: Route, opts: { replace?: boolean } = {}) {
  route = next
  if (opts.replace) history.replaceState({ route }, '')
  else history.pushState({ route }, '')
  window.scrollTo(0, 0)
  emit()
}

export function back(fallback: Route = { name: 'home' }) {
  if (history.length > 1) history.back()
  else navigate(fallback, { replace: true })
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => route,
    () => route,
  )
}
