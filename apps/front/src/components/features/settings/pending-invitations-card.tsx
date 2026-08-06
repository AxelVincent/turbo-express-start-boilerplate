import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Clock, RefreshCw, X } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { orgMembersKeys, useOrgInvitations } from "@/lib/hooks/use-org-members"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const RESEND_COOLDOWN_MS = 60_000

interface PendingInvitationsCardProps {
  orgId: string
  canEdit: boolean
}

export function PendingInvitationsCard({
  orgId,
  canEdit,
}: PendingInvitationsCardProps) {
  const { data: invitationsData, isPending: invitationsLoading } =
    useOrgInvitations(orgId)
  const queryClient = useQueryClient()

  const [resendCooldowns, setResendCooldowns] = useState<
    Record<string, boolean>
  >({})
  const [resendingIds, setResendingIds] = useState<Record<string, boolean>>({})
  const resendTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    return () => {
      Object.values(resendTimers.current).forEach(clearTimeout)
    }
  }, [])

  const handleResendInvitation = useCallback(
    async (invitation: { id: string; email: string; role: string }) => {
      setResendingIds((prev) => ({ ...prev, [invitation.id]: true }))
      try {
        await authClient.organization.inviteMember({
          email: invitation.email,
          role: invitation.role as "member" | "admin",
          organizationId: orgId,
          resend: true,
        })
        toast.success("Invitation resent!", {
          description: `A new email was sent to ${invitation.email}`,
        })
        queryClient.invalidateQueries({
          queryKey: orgMembersKeys.invitations(orgId),
        })
        setResendCooldowns((prev) => ({ ...prev, [invitation.id]: true }))
        resendTimers.current[invitation.id] = setTimeout(() => {
          setResendCooldowns((prev) => ({ ...prev, [invitation.id]: false }))
        }, RESEND_COOLDOWN_MS)
      } catch (err) {
        toast.error("Failed to resend invitation", {
          description: err instanceof Error ? err.message : "Please try again",
        })
      } finally {
        setResendingIds((prev) => ({ ...prev, [invitation.id]: false }))
      }
    },
    [orgId, queryClient],
  )

  const handleCancelInvitation = useCallback(
    async (invitationId: string) => {
      try {
        await authClient.organization.cancelInvitation({ invitationId })
        toast.success("Invitation canceled")
        queryClient.invalidateQueries({
          queryKey: orgMembersKeys.invitations(orgId),
        })
      } catch (err) {
        toast.error("Failed to cancel invitation", {
          description: err instanceof Error ? err.message : "Please try again",
        })
      }
    },
    [orgId, queryClient],
  )

  if (invitationsLoading) return <Skeleton className="h-32 w-full" />

  const allInvitations = Array.isArray(invitationsData) ? invitationsData : []
  const pendingInvitations = allInvitations.filter(
    (inv: any) => inv.status === "pending",
  )
  const isExpired = (inv: any) => new Date(inv.expiresAt) < new Date()

  if (pendingInvitations.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Invitations that haven't been accepted yet.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {pendingInvitations.map((invitation: any) => {
            const expired = isExpired(invitation)
            const onCooldown = resendCooldowns[invitation.id]
            const isResending = resendingIds[invitation.id]

            return (
              <div
                key={invitation.id}
                className={`flex items-center justify-between py-3 ${expired ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {invitation.email?.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{invitation.email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Sent{" "}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                      {expired ? (
                        <span className="flex items-center gap-1 text-destructive">
                          <Clock className="h-3 w-3" />
                          Expired
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires{" "}
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expired && <Badge variant="destructive">Expired</Badge>}
                  <Badge variant="secondary" className="capitalize">
                    {invitation.role}
                  </Badge>
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={onCooldown || isResending}
                        onClick={() => handleResendInvitation(invitation)}
                        title={
                          onCooldown ? "Resent recently" : "Resend invitation"
                        }
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`}
                        />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel invitation?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will revoke the invitation sent to{" "}
                              {invitation.email}. They will no longer be able to
                              join using this invite link.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleCancelInvitation(invitation.id)
                              }
                            >
                              Cancel invitation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
