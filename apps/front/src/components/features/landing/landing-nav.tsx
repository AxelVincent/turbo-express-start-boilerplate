import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"
import { APP_NAME } from "@/lib/constants"
import { Button } from "@/components/ui/button"

interface LandingNavProps {
  isAuthenticated: boolean
}

export function LandingNav({ isAuthenticated }: LandingNavProps) {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            {APP_NAME[0]}
          </div>
          <span className="font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button size="sm" asChild>
              <Link to="/orgs">
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/signin">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
