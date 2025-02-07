import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './Landing.jsx'

createRoot(document.getElementById('root')).render(
  <>
    <link href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&display=swap" rel="stylesheet"></link>
    <Landing />
  </>,
)
