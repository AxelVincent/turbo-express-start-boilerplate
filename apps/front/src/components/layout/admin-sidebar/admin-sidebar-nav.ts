import { LayoutDashboard, ArrowLeft, Users } from "lucide-react"

import type { NavItem, NavGroup } from "../sidebar/sidebar-nav"

export const adminSidebarNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Users",
        url: "/admin/users",
        icon: Users,
      },
    ],
  },
]

export const backToAppItem: NavItem = {
  title: "Back to App",
  url: "/orgs",
  icon: ArrowLeft,
}
