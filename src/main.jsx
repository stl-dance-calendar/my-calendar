import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SubmitEventPage from './SubmitEventPage.jsx'

const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = currentPath === '/submit-an-event' ? SubmitEventPage : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
