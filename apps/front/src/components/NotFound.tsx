import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
      <Card className="max-w-md w-full border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-4xl text-center text-white">404</CardTitle>
          <CardDescription className="text-center text-slate-400 text-lg">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-center">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center">
            <Link
              to="/"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Go Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
