import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@repo/api/routes_web/users/add_user/contract'
import { UserCard } from './user-card'

interface UsersListProps {
  users?: User[]
  isLoading: boolean
  hasSearch: boolean
  onDeleteUser: (userId: string) => void
  isDeletingUser: boolean
}

export function UsersList({
  users,
  isLoading,
  hasSearch,
  onDeleteUser,
  isDeletingUser,
}: UsersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No users found. {hasSearch && 'Try a different search term.'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onDelete={onDeleteUser}
          isDeleting={isDeletingUser}
        />
      ))}
    </div>
  )
}
