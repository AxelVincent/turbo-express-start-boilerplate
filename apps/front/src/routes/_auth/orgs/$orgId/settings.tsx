import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import {
  Check,
  Clock,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/lib/auth-provider"
import { organizationsKeys } from "@/lib/hooks/use-organizations"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/_auth/orgs/$orgId/settings")({
  component: OrgSettingsPage,
})

function OrgSettingsPage() {
  const { orgId } = Route.useParams()
  const { data: orgData, isPending: orgLoading } =
    authClient.useActiveOrganization()
  const { data: membersData, isPending: membersLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      const res = await authClient.organization.listMembers({
        query: { organizationId: orgId },
      })
      return res.data
    },
  })
  const { userId: currentUserId, orgRole } = useAuth()
  const queryClient = useQueryClient()

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedSlug, setEditedSlug] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)

  const currentMember = membersData?.members?.find(
    (m: any) => m.userId === currentUserId,
  )
  const canEdit =
    currentMember?.role === "admin" ||
    currentMember?.role === "owner" ||
    orgRole === "admin" ||
    orgRole === "owner"

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member")
  const [isInviting, setIsInviting] = useState(false)

  const { data: invitationsData, isPending: invitationsLoading } = useQuery({
    queryKey: ["org-invitations", orgId],
    queryFn: async () => {
      const res = await authClient.organization.listInvitations({
        query: { organizationId: orgId },
      })
      return res.data
    },
  })

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

  const nameToSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")

  const handleStartEditing = () => {
    setEditedName(orgData?.name ?? "")
    setEditedSlug(orgData?.slug ?? "")
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    const trimmedName = editedName.trim()
    const trimmedSlug = editedSlug.trim()
    if (!trimmedName || !trimmedSlug) return
    if (trimmedName === orgData?.name && trimmedSlug === orgData?.slug) {
      setIsEditingName(false)
      return
    }
    setIsSavingName(true)
    try {
      await authClient.organization.update({
        data: { name: trimmedName, slug: trimmedSlug },
        organizationId: orgId,
      })
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all })
      authClient.organization.setActive({ organizationId: orgId })
      toast.success("Organization updated")
      setIsEditingName(false)
    } catch (err) {
      toast.error("Failed to update organization", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    } finally {
      setIsSavingName(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    try {
      await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: orgId,
      })
      toast.success("Invitation sent!")
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] })
      queryClient.invalidateQueries({ queryKey: ["org-invitations", orgId] })
      setShowInvite(false)
      setInviteEmail("")
      setInviteRole("member")
    } catch (err) {
      toast.error("Failed to invite member", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    } finally {
      setIsInviting(false)
    }
  }

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
        queryClient.invalidateQueries({ queryKey: ["org-invitations", orgId] })
        setResendCooldowns((prev) => ({ ...prev, [invitation.id]: true }))
        resendTimers.current[invitation.id] = setTimeout(() => {
          setResendCooldowns((prev) => ({ ...prev, [invitation.id]: false }))
        }, 60_000)
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
        await authClient.organization.cancelInvitation({
          invitationId,
        })
        toast.success("Invitation canceled")
        queryClient.invalidateQueries({ queryKey: ["org-invitations", orgId] })
      } catch (err) {
        toast.error("Failed to cancel invitation", {
          description: err instanceof Error ? err.message : "Please try again",
        })
      }
    },
    [orgId, queryClient],
  )

  const handleUpdateMemberRole = async (
    memberId: string,
    role: "member" | "admin",
  ) => {
    try {
      await authClient.organization.updateMemberRole({
        memberId,
        role,
        organizationId: orgId,
      })
      toast.success("Role updated")
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] })
    } catch (err) {
      toast.error("Failed to update role", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: orgId,
      })
      toast.success("Member removed")
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] })
    } catch (err) {
      toast.error("Failed to remove member", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    }
  }

  if (orgLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const memberList = membersData?.members ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization and team members.
        </p>
      </div>

      {/* Org Info */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {orgData?.logo && (
                <AvatarImage src={orgData.logo} alt={orgData.name} />
              )}
              <AvatarFallback className="text-xl">
                {orgData?.name?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              {isEditingName ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => {
                        setEditedName(e.target.value)
                        setEditedSlug(nameToSlug(e.target.value))
                      }}
                      className="h-8 w-60"
                      placeholder="Organization name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName()
                        if (e.key === "Escape") setIsEditingName(false)
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleSaveName}
                      disabled={
                        !editedName.trim() || !editedSlug.trim() || isSavingName
                      }
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setIsEditingName(false)}
                      disabled={isSavingName}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>/</span>
                    <Input
                      value={editedSlug}
                      onChange={(e) =>
                        setEditedSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, ""),
                        )
                      }
                      className="h-6 w-48 text-sm px-1"
                      placeholder="slug"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName()
                        if (e.key === "Escape") setIsEditingName(false)
                      }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{orgData?.name}</h3>
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={handleStartEditing}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    /{orgData?.slug}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitationsLoading && <Skeleton className="h-32 w-full" />}
      {!invitationsLoading &&
        (() => {
          const allInvitations = Array.isArray(invitationsData)
            ? invitationsData
            : []
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
                            <p className="text-sm font-medium">
                              {invitation.email}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                Sent{" "}
                                {new Date(
                                  invitation.createdAt,
                                ).toLocaleDateString()}
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
                                  {new Date(
                                    invitation.expiresAt,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expired && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
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
                                onClick={() =>
                                  handleResendInvitation(invitation)
                                }
                                title={
                                  onCooldown
                                    ? "Resent recently"
                                    : "Resend invitation"
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
                                      {invitation.email}. They will no longer be
                                      able to join using this invite link.
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
        })()}

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage who has access to this organization.
              </CardDescription>
            </div>
            {canEdit && (
              <Dialog open={showInvite} onOpenChange={setShowInvite}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join this organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) =>
                          setInviteRole(v as "member" | "admin")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowInvite(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleInvite}
                      disabled={!inviteEmail.trim() || isInviting}
                    >
                      {isInviting ? "Sending..." : "Send Invite"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {Array.isArray(memberList) &&
              memberList.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {member.user?.image && (
                        <AvatarImage
                          src={member.user.image}
                          alt={member.user?.name}
                        />
                      )}
                      <AvatarFallback>
                        {member.user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.user?.name || member.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.user?.email || member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit &&
                    member.userId !== currentUserId &&
                    member.role !== "owner" ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateMemberRole(
                            member.id,
                            value as "member" | "admin",
                          )
                        }
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          member.role === "owner" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {member.role === "owner" && (
                          <ShieldCheck className="h-3 w-3 mr-1" />
                        )}
                        {member.role}
                      </Badge>
                    )}
                    {canEdit &&
                      member.userId !== currentUserId &&
                      member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
