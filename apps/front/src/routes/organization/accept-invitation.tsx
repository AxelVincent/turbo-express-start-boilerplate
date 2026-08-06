import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export const Route = createFileRoute("/organization/accept-invitation")({
  component: AcceptInvitationPage,
})

function AcceptInvitationPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ from: "/organization/accept-invitation" })
  const invitationId = (search as any).id as string | undefined
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  )
  const [error, setError] = useState("")

  useEffect(() => {
    if (!invitationId) {
      setStatus("error")
      setError("Invalid invitation link. No invitation ID provided.")
      return
    }

    if (!auth.isAuthenticated) {
      const redirectUrl = `/organization/accept-invitation?id=${encodeURIComponent(invitationId)}`
      navigate({
        to: "/signin",
        search: { redirect: redirectUrl } as any,
      })
      return
    }

    acceptInvitation()
  }, [auth.isAuthenticated, invitationId])

  async function acceptInvitation() {
    if (!invitationId) return

    const { error: acceptError } =
      await authClient.organization.acceptInvitation({
        invitationId,
      })

    if (acceptError) {
      setStatus("error")
      setError(acceptError.message ?? "Failed to accept invitation.")
      return
    }

    setStatus("success")
    setTimeout(() => {
      navigate({ to: "/orgs" })
    }, 1500)
  }

  if (!auth.isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">
                Accepting invitation...
              </h2>
              <p className="text-muted-foreground">
                Please wait while we process your invitation.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">
                Invitation accepted!
              </h2>
              <p className="text-muted-foreground">
                Redirecting you to your organizations...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate({ to: "/orgs" })}>
                Go to organizations
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
