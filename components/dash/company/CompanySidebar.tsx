"use client"

import * as React from "react"
import {
  Briefcase,
  Building2,
  Calendar,
  FileText,
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
    url: "/dashboard/company",
    icon: Home,
  },
  {
    title: "LIA İlanları",
    url: "/dashboard/company/job-postings",
    icon: FileText,
  },
  {
    title: "Başvurular",
    url: "/dashboard/company/applications",
    icon: Users,
  },
  {
    title: "Öğrenciler",
    url: "/dashboard/company/students",
    icon: Users,
  },
  {
    title: "Takvim",
    url: "/dashboard/company/calendar",
    icon: Calendar,
  },
  {
    title: "Raporlar",
    url: "/dashboard/company/reports",
    icon: BarChart3,
  },
]

const navSecondaryItems = [
  {
    title: "Company Profili",
    url: "/dashboard/company/profile",
    icon: Building2,
  },
  {
    title: "Ayarlar",
    url: "/dashboard/company/account",
    icon: Settings2,
  },
  {
    title: "Destek",
    url: "#",
    icon: LifeBuoy,
  },
]

interface CompanySidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export function CompanySidebar({ user, ...props }: CompanySidebarProps) {
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
              <a href="/dashboard/company">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Briefcase className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LIA Banken</span>
                  <span className="truncate text-xs">Şirket Yönetimi</span>
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