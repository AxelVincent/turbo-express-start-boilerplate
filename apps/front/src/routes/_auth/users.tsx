import { createFileRoute } from '@tanstack/react-router'
import type { CreateUserInput } from '@repo/api/routes_web/users/add_user/contract'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  useUsers,
  useCreateUser,
  useDeleteUser,
  type UsersSearchParams,
} from '../../lib/hooks/use-users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import {
  UserSearchForm,
  CreateUserDialog,
  DeleteUserDialog,
  UsersList,
  UsersPagination,
} from '../../components/features/users'

/**
 * Example route demonstrating TanStack Query with authenticated API calls
 *
 * This route:
 * 1. Uses TanStack Query for client-side data management with authentication
 * 2. Provides optimistic updates and automatic refetching
 * 3. Type-safe contracts colocated with the route
 * 4. Supports search parameters (e.g., /users?page=2&search=john)
 * 5. Uses feature-based component architecture
 *
 * Note: We don't prefetch on the server because authentication requires client-side Clerk tokens.
 * All data fetching happens client-side with proper auth headers.
 */
export const Route = createFileRoute('/_auth/users')({
  // Validate search parameters
  validateSearch: (search: Record<string, unknown>): UsersSearchParams => {
    return {
      page: Number(search.page) || 1,
      pageSize: Number(search.pageSize) || 10,
      search: (search.search as string) || undefined,
    }
  },

  component: UsersPage,
})

// No need for ProtectedRoute wrapper - authentication is handled by /_auth layout
function UsersPage() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  // Use TanStack Query hooks for data fetching and mutations
  const { data, isLoading, error } = useUsers(search)
  const createUserMutation = useCreateUser()
  const deleteUserMutation = useDeleteUser()

  const handlePageChange = (newPage: number) => {
    navigate({
      search: { ...search, page: newPage },
    })
  }

  const handleSearch = (searchTerm: string) => {
    navigate({
      search: { ...search, search: searchTerm || undefined, page: 1 },
    })
  }

  const handleClearSearch = () => {
    navigate({
      search: { page: 1, pageSize: 10, search: undefined },
    })
  }

  const handleCreateUser = async (input: CreateUserInput) => {
    try {
      await createUserMutation.mutateAsync(input)
      setShowCreateDialog(false)
      toast.success('User created successfully!', {
        description: `${input.name} has been added to the directory.`,
      })
    } catch (error) {
      console.error('Failed to create user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error('Failed to create user', {
        description: errorMessage,
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await deleteUserMutation.mutateAsync(userToDelete)
      setUserToDelete(null)
      toast.success('User deleted successfully', {
        description: 'The user has been removed from the database.',
      })
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Failed to delete user', {
        description: 'Please try again.',
      })
    }
  }

  // Handle loading and error states
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Users</CardTitle>
            <CardDescription className="text-destructive/80">{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Users Directory</h1>
        <p className="text-muted-foreground">
          Manage users with TanStack Query and shadcn/ui components.
        </p>
      </div>

      {/* Search Form */}
      <UserSearchForm
        defaultValue={search.search}
        onSubmit={handleSearch}
        onClear={handleClearSearch}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateUser}
        isSubmitting={createUserMutation.isPending}
      />

      {/* Users List */}
      <UsersList
        users={data?.users}
        isLoading={isLoading}
        hasSearch={!!search.search}
        onDeleteUser={setUserToDelete}
        isDeletingUser={deleteUserMutation.isPending}
      />

      {/* Pagination */}
      {data && (
        <UsersPagination
          currentPage={search.page}
          pageSize={search.pageSize}
          total={data.total}
          usersCount={data.users.length}
          onPageChange={handlePageChange}
        />
      )}

      {/* Info Box */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle>TanStack Query + shadcn/ui Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ TanStack Query manages client-side state</li>
            <li>✓ Automatic caching and background refetching</li>
            <li>✓ shadcn/ui components for consistent design</li>
            <li>✓ Feature-based component architecture</li>
            <li>✓ Type-safe hooks with full TypeScript support</li>
            <li>✓ Complete CRUD operations (GET, POST, DELETE)</li>
            <li>✓ Toast notifications with Sonner</li>
          </ul>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        isDeleting={deleteUserMutation.isPending}
      />
    </div>
  )
}
