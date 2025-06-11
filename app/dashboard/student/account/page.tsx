import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentSidebar } from "@/components/dash/student/StudentSidebar"
import { StudentHeader } from "@/components/dash/student/StudentHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { StudentAccountForm } from "@/components/dash/student/StudentAccountForm"

export default async function StudentAccountPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has student role and get profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      role, 
      first_name, 
      last_name, 
      phone,
      school_id,
      program_id
    `)
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Profile query error:", profileError)
    redirect("/auth/login")
  }

  if (!profile) {
    redirect("/auth/login")
  }

  // Get school and education program info separately (optional)
  let schoolInfo = null
  let programInfo = null
  
  if (profile.school_id) {
    const { data: school } = await supabase
      .from("schools")
      .select("name")
      .eq("id", profile.school_id)
      .single()
    schoolInfo = school
  }
  
  if (profile.program_id) {
    const { data: program } = await supabase
      .from("education_programs")
      .select("name, education_code")
      .eq("id", profile.program_id)
      .single()
    programInfo = program
  }

  // Create complete profile object for component
  const completeProfile = {
    ...profile,
    schools: schoolInfo,
    education_programs: programInfo
  }

  if (profile.role !== "student") {
    redirect("/") // Redirect to home if not a student user
  }

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'Student'} ${profile.last_name || ''}`.trim(),
    email: user.email!, // We know email exists since user is authenticated
    avatar: user.user_metadata?.avatar_url
  }

  const breadcrumbs = [
    { label: "Account" }
  ]

  return (
    <SidebarProvider>
      <StudentSidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <StudentHeader user={user} profile={completeProfile} breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              <div className="px-4 lg:px-6">
                <div className="grid gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground">
                      Manage your account settings and preferences.
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                          Update your personal information and profile picture.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StudentAccountForm 
                          user={user} 
                          profile={completeProfile}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 