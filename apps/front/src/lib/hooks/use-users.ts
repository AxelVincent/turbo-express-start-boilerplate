import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, buildQuery } from '../api-client'
import type { UserListResponse } from '@repo/api/routes_web/users/get_users/contract'
import type { CreateUserInput, User } from '@repo/api/routes_web/users/add_user/contract'

export type UsersSearchParams = {
  page: number
  pageSize: number
  search?: string
}

// Query keys factory for better organization and type safety
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UsersSearchParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
}

// Query function for fetching users
export async function fetchUsers(params: UsersSearchParams): Promise<UserListResponse> {
  const query = buildQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
  })

  return apiClient<UserListResponse>(`/web/users${query}`)
}

// Hook for querying users (client-side)
export function useUsers(params: UsersSearchParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  })
}

// Hook for creating a user
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      return apiClient<User>('/web/users', {
        method: 'POST',
        body: input,
      })
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}

// Hook for deleting a user
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      return apiClient(`/web/users/${userId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}
