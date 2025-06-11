import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentSidebar } from "@/components/dash/student/StudentSidebar"
import { StudentHeader } from "@/components/dash/student/StudentHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  User,
  Search,
  GraduationCap,
  TrendingUp,
  ArrowRight,
} from "lucide-react"

// Import stat components
import { ProfileStatusCard, AvailableJobsCard, MyApplicationsCard } from "@/components/dash/student/stats"

export default async function StudentDashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has student role and get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      schools(name),
      education_programs(name, education_code)
    `)
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  if (profile.role !== "student") {
    redirect("/") // Redirect to home if not a student user
  }

  // Get student's applications count
  // TODO: This will be implemented when we create the applications table
  const applicationCount = 0

  // Get student's LIA posting to determine profile status
  const { data: liaPosting } = await supabase
    .from("lia_postings")
    .select("id, position_title, cover_letter, cv_file_path, working_type_preference, county_id, municipality_id, publish_status")
    .eq("profile_id", user.id)
    .single()

  // Calculate profile completion and status
  const calculateProfileStatus = () => {
    if (!liaPosting) {
      return { status: "Draft" as const, percentage: 0 }
    }

    const fields = [
      liaPosting.position_title,
      liaPosting.cover_letter,
      liaPosting.cv_file_path,
      liaPosting.working_type_preference,
      liaPosting.county_id,
      liaPosting.municipality_id
    ]
    
    const filledFields = fields.filter(field => field && field.toString().trim() !== "").length
    const percentage = Math.round((filledFields / fields.length) * 100)
    
    if (liaPosting.publish_status === "published") {
      return { status: "Published" as const, percentage: 100 }
    } else {
      return { status: "Draft" as const, percentage }
    }
  }

  const profileStatus = calculateProfileStatus()

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'Student'} ${profile.last_name || ''}`.trim(),
    email: user.email!,
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <StudentSidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <StudentHeader user={user} profile={profile} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              <div className="px-4 lg:px-6">
                <div className="grid gap-6">
                  {/* Welcome Section */}
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Welcome back, {profile.first_name || 'Student'}!
                    </h1>
                    <p className="text-muted-foreground">
                      Your LIA journey dashboard - manage your profile, find opportunities, and track applications.
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <AvailableJobsCard />
                    <MyApplicationsCard count={applicationCount} />
                    <ProfileStatusCard 
                      status={profileStatus.status} 
                      percentage={profileStatus.percentage} 
                    />
                  </div>

                  {/* Student Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Your Education Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">School</p>
                          <p className="text-base">{profile.schools?.name || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Program</p>
                          <p className="text-base">
                            {profile.education_programs?.education_code && profile.education_programs?.name
                              ? `${profile.education_programs.education_code} - ${profile.education_programs.name}`
                              : profile.education_programs?.name || 'Not specified'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Complete Your LIA Profile
                        </CardTitle>
                        <CardDescription>
                          Create a comprehensive profile that companies can view when you apply for LIA positions.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" asChild>
                          <a href="/dashboard/student/my-lia-profile" className="flex items-center gap-2">
                            Update Profile
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Search className="h-5 w-5" />
                          Find LIA Opportunities
                        </CardTitle>
                        <CardDescription>
                          Browse available LIA positions from companies and find the perfect match for your skills.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                          <a href="/dashboard/student/job-post-list" className="flex items-center gap-2">
                            Browse Jobs
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity / Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Getting Started Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                            1
                          </div>
                          <div>
                            <p className="text-sm font-medium">Complete your LIA profile</p>
                            <p className="text-xs text-muted-foreground">
                              Add your skills, experience, and preferences to attract employers
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600">
                            2
                          </div>
                          <div>
                            <p className="text-sm font-medium">Browse available positions</p>
                            <p className="text-xs text-muted-foreground">
                              Explore LIA opportunities that match your education program
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-600">
                            3
                          </div>
                          <div>
                            <p className="text-sm font-medium">Apply and track progress</p>
                            <p className="text-xs text-muted-foreground">
                              Submit applications and monitor their status in your dashboard
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 