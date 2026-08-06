import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query"
import { useAuth } from "../auth-provider"
import { apiClient, buildQuery } from "../api-client"
import type { UserListResponse } from "@repo/api/routes_web/users/get_users/contract"
import type {
  CreateUserInput,
  User,
} from "@repo/api/routes_web/users/add_user/contract"
import type { UpdateUserInput } from "@repo/api/routes_web/users/update_user/contract"

type UpdateUserPayload = { id: string } & UpdateUserInput

export type UsersSearchParams = {
  page: number
  pageSize: number
  search?: string
}

// Query keys factory
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: UsersSearchParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
}

// Query options — reusable in both hooks and route loaders
export const usersListOptions = (params: UsersSearchParams) =>
  queryOptions({
    queryKey: usersKeys.list(params),
    queryFn: async () => {
      const query = buildQuery({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
      })
      return apiClient<UserListResponse>(`/web/users${query}`)
    },
    staleTime: 30 * 1000,
  })

// Hook for querying users
export function useUsers(params: UsersSearchParams) {
  const { isLoading, isAuthenticated } = useAuth()

  return useQuery({
    ...usersListOptions(params),
    enabled: !isLoading && isAuthenticated,
  })
}

// Hook for creating a user
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      return apiClient<User>("/web/users", {
        method: "POST",
        body: input,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}

// Hook for updating a user
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateUserPayload) => {
      return apiClient(`/web/users/${id}`, {
        method: "PATCH",
        body: input,
      })
    },
    onSuccess: () => {
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
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}
