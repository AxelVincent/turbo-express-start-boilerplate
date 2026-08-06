import { APP_NAME } from "@/lib/constants"

export function LandingFooter() {
  return (
    <footer className="py-8 px-6 border-t">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
            {APP_NAME[0]}
          </div>
          <span className="text-sm text-muted-foreground">{APP_NAME}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Turborepo + React 19 + Express + PostgreSQL + Better Auth
        </p>
      </div>
    </footer>
  )
}
