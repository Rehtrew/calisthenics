import { useEffect } from 'react'
import { getLastDirection, useRoute } from './lib/router'
import { useAppState } from './lib/store'
import { Home } from './views/Home'
import { Setup } from './views/Setup'
import { Workout } from './views/Workout'
import { SessionView } from './views/SessionView'
import { Story } from './views/Story'
import { History } from './views/History'
import { Settings } from './views/Settings'
import { DayPreview } from './views/DayPreview'
import { ProgramOverview } from './views/ProgramOverview'
import { WeightView } from './views/WeightView'

export default function App() {
  const route = useRoute()
  const theme = useAppState().settings.theme

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0b0b' : '#f4f4f2')
  }, [theme])

  const enter = getLastDirection() === 'back' ? 'no-enter' : undefined
  return <div className={enter}>{screen(route)}</div>
}

function screen(route: ReturnType<typeof useRoute>) {
  switch (route.name) {
    case 'setup':
      return <Setup key={route.dayId} dayId={route.dayId} />
    case 'day':
      return <DayPreview key={`${route.levelIndex}-${route.dayId}`} levelIndex={route.levelIndex} dayId={route.dayId} />
    case 'program':
      return <ProgramOverview />
    case 'workout':
      return <Workout />
    case 'summary':
      return <Story key={route.sessionId} sessionId={route.sessionId} />
    case 'session':
      return <SessionView key={route.sessionId} sessionId={route.sessionId} mode="detail" />
    case 'history':
      return <History />
    case 'settings':
      return <Settings />
    case 'weight':
      return <WeightView />
    default:
      return <Home />
  }
}
