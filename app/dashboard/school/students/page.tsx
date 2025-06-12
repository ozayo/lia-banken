import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SchoolSidebar } from "@/components/dash/school/SchoolSidebar"
import { SchoolHeader } from "@/components/dash/school/SchoolHeader"
import { StudentsManager } from "@/components/dash/school/StudentsManager"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function StudentsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Get user profile and school information
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      *,
      schools!inner(*)
    `)
    .eq("id", user.id)
    .single()

  if (profileError || !profile || !profile.schools) {
    redirect("/login")
  }

  // Check if user has school role
  if (profile.role !== "school") {
    redirect("/")
  }

  // Get students data (server-side to bypass RLS)
  const { data: studentsData, error: studentsError } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      lia_id
    `)
    .eq("role", "student")
    .eq("school_id", profile.school_id)

  // Get LIA data separately
  const { data: liasData, error: liasError } = await supabase
    .from("lias")
    .select(`
      id,
      lia_code,
      education_program_id
    `)

  // Get education programs data
  const { data: programsData, error: programsError } = await supabase
    .from("education_programs")
    .select("id, name")

  // Get published profiles data
  const { data: publishedProfiles, error: publishedError } = await supabase
    .from("published_student_profiles")
    .select("student_id, is_published")

  // Get applications data
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("student_id, status")
    .eq("school_id", profile.school_id)

  // Process and combine data
  const studentsWithData = (studentsData || []).map(student => {
    const studentLia = liasData?.find(lia => lia.id === student.lia_id)
    const program = programsData?.find(p => p.id === studentLia?.education_program_id)
    const publishedProfile = publishedProfiles?.find(p => p.student_id === student.id)
    const studentApplications = applications?.filter(a => a.student_id === student.id) || []
    const acceptedApplications = studentApplications.filter(a => a.status === 'accepted')

    return {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      programName: program?.name || 'No Program',
      liaCode: studentLia?.lia_code || 'No LIA',
      liaProfileActive: publishedProfile?.is_published || false,
      totalApplications: studentApplications.length,
      status: acceptedApplications.length > 0 ? 'Done' : 'Pending'
    }
  })

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'School'} ${profile.last_name || 'Admin'}`,
    email: user.email!,
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <SchoolSidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <SchoolHeader breadcrumbs={[{ label: "Students" }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="grid gap-4 px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Students</h1>
                    <p className="text-muted-foreground">
                      Manage and view your school's students
                    </p>
                  </div>
                </div>

                <StudentsManager
                  students={studentsWithData}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 