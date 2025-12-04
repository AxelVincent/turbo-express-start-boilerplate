import { Home, Users } from 'lucide-react'

export interface NavItem {
  title: string
  url: string
  icon: typeof Home
  isActive?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const sidebarNavGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      {
        title: 'Home',
        url: '/',
        icon: Home,
      },
      {
        title: 'Users',
        url: '/users',
        icon: Users,
      },
    ],
  },
]
