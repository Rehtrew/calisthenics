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

type Direction = 'forward' | 'back'

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
 * old and new screens slide and shared elements (the day title) morph. The
 * update resolves on the next task so React has committed the new screen before
 * the browser snapshots it.
 */
function applyRoute(next: Route, direction: Direction) {
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
    update()
    window.scrollTo(0, 0)
    return new Promise<void>((resolve) => setTimeout(resolve, 0))
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
