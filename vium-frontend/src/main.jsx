import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { isLocal, BASE_URL } from './lib/env'

// Startup logs for environment
// eslint-disable-next-line no-console
console.log('Ambiente atual:', isLocal ? 'Desenvolvimento' : 'Produção')
// eslint-disable-next-line no-console
console.log('URL base usada:', BASE_URL)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
