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

/** Screens that show the big day title; only between these does the title morph. */
const TITLE_ROUTES = new Set<Route['name']>(['home', 'setup', 'day'])

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => { finished: Promise<void> }
}

/**
 * Swap the route inside a view transition when the browser supports it, so the
 * old and new screens slide and shared elements (the day title) morph. React is
 * flushed synchronously inside the update callback, so the browser snapshots the
 * new screen rather than a stale copy of the old one.
 */
function applyRoute(next: Route, direction: Direction, animate = true) {
  lastDirection = direction
  const doc = document as ViewTransitionDocument
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const update = () => {
    route = next
    emit()
  }
  if (!animate || !doc.startViewTransition || reduce) {
    update()
    window.scrollTo(0, 0)
    return
  }
  const html = document.documentElement
  html.dataset.nav = direction
  if (TITLE_ROUTES.has(route.name) && TITLE_ROUTES.has(next.name)) html.dataset.vtTitle = '1'
  const transition = doc.startViewTransition(() => {
    flushSync(update)
    window.scrollTo(0, 0)
  })
  void transition.finished.finally(() => {
    delete html.dataset.nav
    delete html.dataset.vtTitle
  })
}

/**
 * Set by the app's own back button right before history.back(). A popstate
 * without it comes from the browser (iOS swipe-back, browser buttons), which
 * has already animated the page itself, so we swap screens without a transition.
 */
let expectingOwnPop = false

window.addEventListener('popstate', (e) => {
  const animate = expectingOwnPop
  expectingOwnPop = false
  applyRoute((e.state?.route as Route | undefined) ?? { name: 'home' }, 'back', animate)
})

export function navigate(next: Route, opts: { replace?: boolean } = {}) {
  if (opts.replace) history.replaceState({ route: next }, '')
  else history.pushState({ route: next }, '')
  applyRoute(next, 'forward')
}

export function back(fallback: Route = { name: 'home' }) {
  if (history.length > 1) {
    expectingOwnPop = true
    history.back()
    setTimeout(() => {
      expectingOwnPop = false
    }, 1000)
  } else navigate(fallback, { replace: true })
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
