"use client"

import * as React from "react"
import {
  BookOpen,
  Building2,
  Calendar,
  GraduationCap,
  LifeBuoy,
  Settings2,
  Users,
  BarChart3,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMainItems = [
  {
    title: "Dashboard",
    url: "/dashboard/school",
    icon: Home,
  },
  {
    title: "Manage Programs",
    url: "/dashboard/school/programs",
    icon: BookOpen,
  },
  {
    title: "Manage LIA",
    url: "/dashboard/school/active-lias",
    icon: Users,
  },
  {
    title: "Archived LIA", 
    url: "/dashboard/school/archived-lias",
    icon: Calendar,
  },
  {
    title: "Students",
    url: "/dashboard/school/students",
    icon: GraduationCap,
  },
  {
    title: "Analytics",
    url: "/dashboard/school/analytics",
    icon: BarChart3,
  },
]

const navSecondaryItems = [
  {
    title: "School Profile",
    url: "/dashboard/school/profile",
    icon: Building2,
  },
  {
    title: "Settings",
    url: "/dashboard/school/settings",
    icon: Settings2,
  },
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
]

interface SchoolSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export function SchoolSidebar({ user, ...props }: SchoolSidebarProps) {
  // Create user data for NavUser
  const userData = {
    name: user.name,
    email: user.email,
    avatar: user.avatar || "/avatars/default.jpg", // fallback avatar
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard/school">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LIA Banken</span>
                  <span className="truncate text-xs">School Management</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
} 