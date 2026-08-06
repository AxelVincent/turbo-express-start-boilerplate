import { Link, useRouterState } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { sidebarNavGroups } from "./sidebar-nav"
import { UserMenu } from "./UserMenu"
import { AdminFooter } from "./AdminFooter"
import { SidebarThemeToggle } from "./SidebarThemeToggle"
import { adminSidebarNavGroups } from "../admin-sidebar/admin-sidebar-nav"
import { APP_NAME } from "@/lib/constants"

interface AppSidebarProps {
  variant?: "user" | "admin"
}

export function AppSidebar({ variant = "user" }: AppSidebarProps) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const isAdminVariant = variant === "admin"

  const session = authClient.useSession()
  const userRole = session.data?.user?.role as string | undefined
  const isAdmin = userRole === "admin" || userRole === "super_admin"

  const navGroups = isAdminVariant
    ? adminSidebarNavGroups
    : sidebarNavGroups.filter((group) => !group.adminOnly || isAdmin)

  const getIsActive = (itemUrl: string) => {
    if (isAdminVariant) {
      return itemUrl === "/admin"
        ? currentPath === "/admin"
        : currentPath.startsWith(itemUrl)
    }
    return currentPath === itemUrl
  }

  return (
    <SidebarWrapper>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={isAdminVariant ? "Admin" : "Home"}
            >
              <a href={isAdminVariant ? "/admin" : "/"}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-sm font-bold">{APP_NAME[0]}</span>
                </div>
                <div className="grid text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">{APP_NAME}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => !item.adminOnly || isAdmin)
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={getIsActive(item.url)}
                        tooltip={item.title}
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarThemeToggle />
        {isAdminVariant ? <AdminFooter /> : <UserMenu />}
      </SidebarFooter>

      <SidebarRail />
    </SidebarWrapper>
  )
}

function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar()
  const isMobile = useIsMobile()

  const width = isMobile
    ? undefined
    : `var(${state === "expanded" ? "--sidebar-width" : "--sidebar-width-icon"})`

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0"
      style={{ width, minWidth: width, maxWidth: width }}
    >
      {children}
    </Sidebar>
  )
}
