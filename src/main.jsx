import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from '@/App.jsx'
import '@/index.css'
import { clearAllSearchlystLocalStorageCaches } from '@/lib/visibilityStorageKeys'
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (import.meta.env.DEV) {
    window.__clearSearchlystCache = () => {
        const r = clearAllSearchlystLocalStorageCaches()
        console.info('[Searchlyst] Cleared localStorage keys:', r.removedCount, r.keys)
        return r
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </ErrorBoundary>
)
