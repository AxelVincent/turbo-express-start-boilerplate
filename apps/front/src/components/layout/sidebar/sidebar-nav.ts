import { ShieldCheck, Building } from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: typeof Building
  adminOnly?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
  adminOnly?: boolean
}

export const sidebarNavGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      {
        title: "Organizations",
        url: "/orgs",
        icon: Building,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Backoffice",
        url: "/admin",
        icon: ShieldCheck,
        adminOnly: true,
      },
    ],
    adminOnly: true,
  },
]
