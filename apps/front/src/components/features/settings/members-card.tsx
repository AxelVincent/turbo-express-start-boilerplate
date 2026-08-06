import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ShieldCheck, Trash2, UserPlus } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { orgMembersKeys, useOrgMembers } from "@/lib/hooks/use-org-members"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MembersCardProps {
  orgId: string
  canEdit: boolean
  currentUserId?: string
}

export function MembersCard({
  orgId,
  canEdit,
  currentUserId,
}: MembersCardProps) {
  const { data: membersData } = useOrgMembers(orgId)
  const queryClient = useQueryClient()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member")
  const [isInviting, setIsInviting] = useState(false)

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
      queryClient.invalidateQueries({ queryKey: orgMembersKeys.members(orgId) })
      queryClient.invalidateQueries({
        queryKey: orgMembersKeys.invitations(orgId),
      })
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
      queryClient.invalidateQueries({ queryKey: orgMembersKeys.members(orgId) })
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
      queryClient.invalidateQueries({ queryKey: orgMembersKeys.members(orgId) })
    } catch (err) {
      toast.error("Failed to remove member", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    }
  }

  const memberList = membersData?.members ?? []

  return (
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
  )
}
