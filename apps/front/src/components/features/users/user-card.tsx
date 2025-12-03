import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { User } from '@repo/api/routes_web/users/add_user/contract'

interface UserCardProps {
  user: User
  onDelete: (userId: string) => void
  isDeleting: boolean
}

export function UserCard({ user, onDelete, isDeleting }: UserCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {user.id}
              </Badge>
            </div>
            <CardDescription className="text-blue-400">{user.email}</CardDescription>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(user.id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
