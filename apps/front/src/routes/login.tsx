import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { SignIn, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })

  useEffect(() => {
    // If user is already signed in, redirect them
    if (isSignedIn) {
      // Check if there's a redirect URL in the search params
      const redirectUrl = (search as any).redirect || '/users'
      navigate({ to: redirectUrl })
    }
  }, [isSignedIn, navigate, search])

  // Don't show the sign-in form if already signed in
  if (isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to access your account</p>
        </div>

        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-slate-800 shadow-xl',
              },
            }}
            signUpUrl="/signup"
            afterSignInUrl={(search as any).redirect || '/users'}
          />
        </div>
      </div>
    </div>
  )
}
