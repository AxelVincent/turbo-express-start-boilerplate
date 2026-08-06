import { useNavigate } from "@tanstack/react-router"
import { ChevronsUpDown, Settings, LogOut, UserPlus, User } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useAuth } from "@/lib/auth-provider"
import {
  useOrganizations,
  useSetActiveOrganization,
} from "@/lib/hooks/use-organizations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"

export function UserMenu() {
  const navigate = useNavigate()
  const { user, orgId, orgRole } = useAuth()
  const { data: orgs } = useOrganizations()
  const setActiveOrg = useSetActiveOrganization()
  const { isMobile } = useSidebar()
  const currentOrg = orgs?.find((o) => o.id === orgId)
  const otherOrgs = orgs?.filter((o) => o.id !== orgId) ?? []

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/signin"
  }

  const handleSwitchOrg = async (targetOrgId: string) => {
    await setActiveOrg.mutateAsync(targetOrgId)
    navigate({ to: "/orgs" })
  }

  const handleOrgSettings = () => {
    if (orgId) {
      navigate({ to: "/orgs" })
    }
  }

  const handleInviteMembers = () => {
    if (orgId) {
      navigate({ to: "/orgs" })
    }
  }

  if (!user) return null

  const roleLabel =
    orgRole === "owner" ? "Owner" : orgRole === "admin" ? "Admin" : "Member"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          tooltip={user.name}
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="rounded-lg">
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="rounded-lg">
                {user.name?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {currentOrg && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organization
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleOrgSettings} className="gap-2 p-2">
              <Avatar className="h-6 w-6">
                {currentOrg.logo && (
                  <AvatarImage src={currentOrg.logo} alt={currentOrg.name} />
                )}
                <AvatarFallback className="text-xs">
                  {currentOrg.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 leading-tight">
                <span className="truncate text-sm">{currentOrg.name}</span>
              </div>
              <Badge
                variant="secondary"
                className="ml-auto text-[10px] px-1.5 py-0"
              >
                {roleLabel}
              </Badge>
              <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleInviteMembers}
              className="gap-2 p-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite members</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {otherOrgs.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch organization
            </DropdownMenuLabel>
            {otherOrgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                className="gap-2 p-2"
              >
                <Avatar className="h-6 w-6">
                  {org.logo && <AvatarImage src={org.logo} alt={org.name} />}
                  <AvatarFallback className="text-xs">
                    {org.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{org.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => navigate({ to: "/settings" })}
          className="gap-2 p-2"
        >
          <User className="h-4 w-4" />
          <span>Account settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="gap-2 p-2">
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
