export type User = {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type CreateUserInput = {
  name: string
  email: string
}

export type UpdateUserInput = {
  name?: string
  email?: string
}

// Database result type
export type DbUser = {
  id: string
  name: string
  email: string
  created_at: Date
  updated_at: Date
}
