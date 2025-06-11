"use client"

import * as React from "react"
import {
  GraduationCap,
  Home,
  Search,
  FileText,
  Settings2,
  User,
  Briefcase,
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
    url: "/dashboard/student",
    icon: Home,
  },
  {
    title: "LIA Profile",
    url: "/dashboard/student/my-lia-profile",
    icon: User,
  },
  {
    title: "Find LIA",
    url: "/dashboard/student/job-post-list",
    icon: Search,
  },
  {
    title: "Manage Applications",
    url: "/dashboard/student/my-applications",
    icon: FileText,
  },
]

const navSecondaryItems = [
  {
    title: "Settings",
    url: "/dashboard/student/settings",
    icon: Settings2,
  },
]

interface StudentSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export function StudentSidebar({ user, ...props }: StudentSidebarProps) {
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
              <a href="/dashboard/student">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LIA Banken</span>
                  <span className="truncate text-xs">Student Portal</span>
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