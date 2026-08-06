import { useNavigate } from "@tanstack/react-router"
import { Building2, ChevronsUpDown, Plus } from "lucide-react"
import {
  useOrganizations,
  useSetActiveOrganization,
} from "@/lib/hooks/use-organizations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"

interface OrgSwitcherProps {
  currentOrgId: string
  variant?: "sidebar" | "header"
}

export function OrgSwitcher({
  currentOrgId,
  variant = "sidebar",
}: OrgSwitcherProps) {
  const navigate = useNavigate()
  const { data: orgs } = useOrganizations()
  const setActiveOrg = useSetActiveOrganization()

  const currentOrg = orgs?.find((o) => o.id === currentOrgId)

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrgId) return
    await setActiveOrg.mutateAsync(orgId)
    navigate({ to: "/orgs" })
  }

  const trigger =
    variant === "header" ? (
      <Button variant="ghost" size="sm" className="gap-1 px-2 font-medium">
        <span className="truncate max-w-[140px]">
          {currentOrg?.name ?? "Select Org"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </Button>
    ) : (
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        tooltip={currentOrg?.name ?? "Select Org"}
      >
        <Avatar className="h-8 w-8 rounded-lg">
          {currentOrg?.logo && (
            <AvatarImage src={currentOrg.logo} alt={currentOrg.name} />
          )}
          <AvatarFallback className="rounded-lg">
            {currentOrg?.name?.charAt(0).toUpperCase() ?? (
              <Building2 className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-semibold">
            {currentOrg?.name ?? "Select Org"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            Organization
          </span>
        </div>
        <ChevronsUpDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
      </SidebarMenuButton>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {orgs?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className="gap-2 p-2"
          >
            <Avatar className="h-6 w-6">
              {org.logo && <AvatarImage src={org.logo} alt={org.name} />}
              <AvatarFallback className="text-xs">
                {org.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{org.name}</span>
            {org.id === currentOrgId && (
              <span className="ml-auto text-xs text-muted-foreground">
                Current
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 p-2"
          onClick={() => navigate({ to: "/orgs" })}
        >
          <Plus className="h-4 w-4" />
          <span>Create Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
