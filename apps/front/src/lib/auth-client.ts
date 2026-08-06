import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { inferAdditionalFields } from "better-auth/client/plugins"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3030"

export const authClient = createAuthClient({
  baseURL: `${API_URL}/auth`,
  plugins: [
    organizationClient(),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
        },
      },
    }),
  ],
})
