import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SchoolSidebar } from "@/components/dash/school/SchoolSidebar"
import { SchoolHeader } from "@/components/dash/school/SchoolHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function SchoolDashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has school role and get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id, first_name, last_name, phone")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  if (profile.role !== "school") {
    redirect("/") // Redirect to home if not a school user
  }

  if (!profile.school_id) {
    // If school admin doesn't have a school yet, something went wrong
    redirect("/auth/login")
  }

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'School'} ${profile.last_name || 'Admin'}`,
    email: user.email!, // We know email exists since user is authenticated
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <SchoolSidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <SchoolHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Welcome Section */}
              <div className="grid gap-4 px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">School Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your school, organize programs and track student progress.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid auto-rows-min gap-4 md:grid-cols-4 px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">
                      +20.1% from last month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Programs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">
                      +2 new programs
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      LIA Placements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">892</div>
                    <p className="text-xs text-muted-foreground">
                      89% success rate
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">
                      This academic year
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid gap-4 md:grid-cols-2 px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>
                      Latest updates from your school
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">New student registration</p>
                        <p className="text-xs text-muted-foreground">
                          Ali Veli - Registered for Frontend Development program
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">LIA placement</p>
                        <p className="text-xs text-muted-foreground">
                          Ayşe Özkan - Started LIA at TechCorp
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Program updated</p>
                        <p className="text-xs text-muted-foreground">
                          Backend Development program curriculum updated
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Frequently used operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Create New Program</div>
                      <div className="text-xs text-muted-foreground">
                        Add a new education program to your school
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Add Term</div>
                      <div className="text-xs text-muted-foreground">
                        Add new term to existing programs
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Student List</div>
                      <div className="text-xs text-muted-foreground">
                        View registered students
                      </div>
                    </button>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 