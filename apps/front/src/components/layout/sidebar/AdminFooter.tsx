import { Link } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { backToAppItem } from "../admin-sidebar/admin-sidebar-nav"

export function AdminFooter() {
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={backToAppItem.title}>
          <Link to={backToAppItem.url}>
            <backToAppItem.icon />
            <span>{backToAppItem.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {user && (
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild tooltip={user.name}>
            <Link to="/">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  )
}
