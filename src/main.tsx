import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Intercept fetch to prepend the production API origin when running in packaged mode (file:// protocol)
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const isPackaged = window.location.protocol === 'file:' || 
                       window.location.hostname === '' ||
                       navigator.userAgent.toLowerCase().includes('electron');
                       
    if (isPackaged && typeof input === 'string' && input.startsWith('/api')) {
      const origin = 'https://kbs-cloud.com';
      return originalFetch(origin + input, init);
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
