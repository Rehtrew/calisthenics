import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { getState } from './store'

export type Route =
  | { name: 'home' }
  | { name: 'setup'; dayId: string }
  | { name: 'day'; levelIndex: number; dayId: string }
  | { name: 'program' }
  | { name: 'workout' }
  | { name: 'summary'; sessionId: string }
  | { name: 'session'; sessionId: string }
  | { name: 'history' }
  | { name: 'settings' }
  | { name: 'weight' }

type Direction = 'forward' | 'back'

let lastDirection: Direction = 'forward'

/** How the current screen was reached; screens reached by going back skip their entrance animations. */
export const getLastDirection = () => lastDirection

const initial: Route = getState().active ? { name: 'workout' } : { name: 'home' }

let route: Route = (history.state?.route as Route | undefined) ?? initial
history.replaceState({ route }, '')

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => { finished: Promise<void> }
}

/**
 * Swap the route inside a view transition when the browser supports it, so the
 * old and new screens slide and shared elements (the day title) morph. React is
 * flushed synchronously inside the update callback, so the browser snapshots the
 * new screen rather than a stale copy of the old one.
 */
function applyRoute(next: Route, direction: Direction) {
  lastDirection = direction
  const doc = document as ViewTransitionDocument
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const update = () => {
    route = next
    emit()
  }
  if (!doc.startViewTransition || reduce) {
    update()
    window.scrollTo(0, 0)
    return
  }
  document.documentElement.dataset.nav = direction
  const transition = doc.startViewTransition(() => {
    flushSync(update)
    window.scrollTo(0, 0)
  })
  void transition.finished.finally(() => {
    delete document.documentElement.dataset.nav
  })
}

window.addEventListener('popstate', (e) => {
  applyRoute((e.state?.route as Route | undefined) ?? { name: 'home' }, 'back')
})

export function navigate(next: Route, opts: { replace?: boolean } = {}) {
  if (opts.replace) history.replaceState({ route: next }, '')
  else history.pushState({ route: next }, '')
  applyRoute(next, 'forward')
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
