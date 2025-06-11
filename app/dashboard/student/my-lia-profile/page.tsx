import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentSidebar } from "@/components/dash/student/StudentSidebar"
import { StudentHeader } from "@/components/dash/student/StudentHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { LiaProfileManager } from "@/components/dash/student/LiaProfileManager"

export default async function StudentLiaProfilePage() {
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
      program_id,
      lia_id
    `)
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    redirect("/auth/login")
  }

  if (profile.role !== "student") {
    redirect("/") // Redirect to home if not a student user
  }

  // Get school, education program and LIA info
  let schoolInfo = null
  let programInfo = null
  let liaInfo = null
  
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

  if (profile.lia_id) {
    const { data: lia } = await supabase
      .from("lias")
      .select("education_term, lia_code, lia_start_date, lia_end_date")
      .eq("id", profile.lia_id)
      .single()
    liaInfo = lia
  }

  // Get existing LIA posting for this student
  const { data: liaPosting } = await supabase
    .from("lia_postings")
    .select(`
      *,
      counties(name),
      municipalities(name)
    `)
    .eq("profile_id", user.id)
    .single()

  // Get student links
  const { data: studentLinks } = await supabase
    .from("student_links")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })

  // Get counties for location selection
  const { data: counties } = await supabase
    .from("counties")
    .select("id, name")
    .order("name")

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'Student'} ${profile.last_name || ''}`.trim(),
    email: user.email!,
    avatar: user.user_metadata?.avatar_url
  }

  const breadcrumbs = [
    { label: "LIA Profile" }
  ]

  return (
    <SidebarProvider>
      <StudentSidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <StudentHeader user={user} profile={profile} breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              <div className="px-4 lg:px-6">
                <div className="grid gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">My LIA Profile</h1>
                    <p className="text-muted-foreground">
                      Create and manage your LIA internship profile that companies and schools can view.
                    </p>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>LIA Profile Information</CardTitle>
                      <CardDescription>
                        Complete your profile to showcase your skills and preferences to potential employers.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <LiaProfileManager
                        user={user}
                        profile={profile}
                        schoolInfo={schoolInfo}
                        programInfo={programInfo}
                        liaInfo={liaInfo}
                        liaPosting={liaPosting}
                        studentLinks={studentLinks || []}
                        counties={counties || []}
                      />
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