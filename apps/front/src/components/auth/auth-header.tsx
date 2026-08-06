import { Link } from "@tanstack/react-router"
import { APP_NAME } from "@/lib/constants"

export function AuthHeader() {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-lg font-bold">{APP_NAME[0]}</span>
        </div>
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </Link>
    </div>
  )
}
