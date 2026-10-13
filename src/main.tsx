import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { startSync } from './lib/sync'
import { startUpdateCheck } from './lib/update'

startSync()
startUpdateCheck()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
