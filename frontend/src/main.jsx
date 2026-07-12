import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const isInvalidKey = !clerkPubKey || clerkPubKey === 'your_clerk_publishable_key_here' || clerkPubKey.trim() === '';

if (isInvalidKey) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f3f4f6',
      color: '#1f2937',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '550px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#ef4444',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 auto 20px auto'
        }}>
          !
        </div>
        <h1 style={{ color: '#111827', margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700' }}>Clerk Configuration Required</h1>
        <p style={{ margin: '0 0 24px 0', lineHeight: '1.6', color: '#4b5563', fontSize: '15px' }}>
          To start the application, you need to configure a valid <strong>Clerk Publishable Key</strong> in your frontend environment. Leaving this key unset or as a placeholder causes the Clerk SDK to crash, resulting in a blank screen.
        </p>
        <div style={{
          textAlign: 'left',
          backgroundColor: '#f9fafb',
          padding: '16px 20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          fontSize: '13px',
          fontFamily: 'monospace',
          marginBottom: '24px'
        }}>
          <strong style={{ color: '#059669' }}>Instructions:</strong><br/>
          1. Open the file <strong>frontend/.env</strong><br/>
          2. Replace the placeholder value with your real Clerk Publishable Key:<br/>
          <span style={{ color: '#2563eb', display: 'block', marginTop: '6px', fontWeight: 'bold' }}>
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
          You can get a free key from the <a href="https://dashboard.clerk.com/" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Clerk Dashboard</a>.
        </p>
      </div>
    </div>
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" />
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>,
  )
}