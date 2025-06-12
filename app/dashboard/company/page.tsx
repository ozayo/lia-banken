import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompanySidebar } from "@/components/dash/company/CompanySidebar"
import { CompanyHeader } from "@/components/dash/company/CompanyHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function CompanyDashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log('Company Dashboard - User:', user)
  console.log('Company Dashboard - User Error:', userError)

  if (!user) {
    console.log('Company Dashboard - No user, redirecting to login')
    redirect("/auth/login")
  }

  // Check if user has company role and get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id, first_name, last_name, phone")
    .eq("id", user.id)
    .single()

  console.log('Company Dashboard - Profile:', profile)
  console.log('Company Dashboard - Profile Error:', profileError)
  console.log('Company Dashboard - User ID:', user.id)

  if (!profile) {
    console.log('Company Dashboard - No profile, redirecting to login')
    redirect("/auth/login")
  }

  if (profile.role !== "company") {
    console.log('Company Dashboard - Not company role, redirecting to home')
    redirect("/") // Redirect to home if not a company user
  }

  if (!profile.company_id) {
    // If company admin doesn't have a company yet, something went wrong
    redirect("/auth/login")
  }

  // Get company information
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .single()

  if (!company) {
    redirect("/auth/login")
  }

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'Company'} ${profile.last_name || 'Admin'}`,
    email: user.email!, // We know email exists since user is authenticated
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <CompanySidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <CompanyHeader user={user} profile={profile} company={company} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Welcome Section */}
              <div className="grid gap-4 px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">Company Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your company, create internship postings and evaluate student applications.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid auto-rows-min gap-4 md:grid-cols-4 px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Job Postings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">
                      +4 this month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">142</div>
                    <p className="text-xs text-muted-foreground">
                      +22 this week
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Interns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18</div>
                    <p className="text-xs text-muted-foreground">
                      3 different positions
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Completed Internships
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
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
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest updates from your company
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">New application</p>
                        <p className="text-xs text-muted-foreground">
                          Mehmet Kaya applied for Frontend Developer position
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Internship started</p>
                        <p className="text-xs text-muted-foreground">
                          Ayşe Demir started internship as Backend Developer
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Job posting updated</p>
                        <p className="text-xs text-muted-foreground">
                          UX/UI Designer posting was updated
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Frequently used actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Create New Job Posting</div>
                      <div className="text-xs text-muted-foreground">
                        Publish a new internship position
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Review Applications</div>
                      <div className="text-xs text-muted-foreground">
                        Evaluate pending applications
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Company Profile</div>
                      <div className="text-xs text-muted-foreground">
                        Update your company information
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