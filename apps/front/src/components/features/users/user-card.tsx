import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { User } from "@repo/api/routes_web/users/add_user/contract"
import type { UserRole } from "@repo/api/routes_web/users/update_user/contract"

interface UserCardProps {
  user: User
  onDelete: (userId: string) => void
  isDeleting: boolean
  onRoleChange?: (_userId: string, _role: UserRole) => void
}

// Typed against the contract union, so a role that the API would reject can't
// be added to the picker without a compile error.
const ROLES: { value: UserRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
]

function roleBadgeVariant(role: string) {
  if (role === "super_admin") return "default" as const
  if (role === "admin") return "secondary" as const
  return "outline" as const
}

export function UserCard({
  user,
  onDelete,
  isDeleting,
  onRoleChange,
}: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{user.name}</CardTitle>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            {onRoleChange ? (
              <Select
                value={user.role}
                onValueChange={(role) =>
                  onRoleChange(user.id, role as UserRole)
                }
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(user.id)}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <span className="text-xs text-muted-foreground">
          Created {new Date(user.createdAt).toLocaleDateString()}
        </span>
      </CardContent>
    </Card>
  )
}
