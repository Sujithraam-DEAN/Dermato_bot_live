import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Stethoscope className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">DermaLLaMa-GPT</span>
        </Link>
        
        <nav className="flex items-center space-x-6">
          <SignedIn>
            <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 font-medium">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-primary">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  )
}

export default Header