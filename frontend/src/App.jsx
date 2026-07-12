import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Header from './components/Header'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Consultation from './pages/Consultation'

function App() {


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/dashboard" 
            element={
              <SignedIn>
                <Dashboard />
              </SignedIn>
            } 
          />
          <Route 
            path="/consultation/:diagnosisId" 
            element={
              <SignedIn>
                <Consultation />
              </SignedIn>
            } 
          />
        </Routes>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </main>
    </div>
  )
}

export default App