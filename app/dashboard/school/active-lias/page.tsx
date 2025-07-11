import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SchoolSidebar } from "@/components/dash/school/SchoolSidebar"
import { SchoolHeader } from "@/components/dash/school/SchoolHeader"
import { ActiveLiasManager } from "@/components/dash/school/ActiveLiasManager"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function ActiveLiasPage() {
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

  // Get school's education programs for the form
  const { data: educationPrograms, error: programsError } = await supabase
    .from("education_programs")
    .select(`
      *,
      education_categories(name)
    `)
    .eq("school_id", profile.school_id)
    .order("name")

  // Get school locations for the form
  const { data: schoolLocations, error: locationsError } = await supabase
    .from("school_locations")
    .select("*")
    .eq("school_id", profile.school_id)
    .order("name")

  // Get enrollment counts for LIAs (server-side to bypass RLS)
  let enrollmentData: Record<string, number> = {}
  
  // Get LIAs and count enrollments manually
  const { data: lias } = await supabase
    .from("lias")
    .select("id")
    .eq("school_id", profile.school_id)
    .in("lia_status", ["active", "inactive"])

  if (lias) {
    const liaIds = lias.map(l => l.id)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("lia_id")
      .in("lia_id", liaIds)
      .eq("role", "student")

    if (profiles) {
      enrollmentData = profiles.reduce((acc, profile) => {
        if (profile.lia_id) {
          acc[profile.lia_id] = (acc[profile.lia_id] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    }
  }

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
        <SchoolHeader breadcrumbs={[{ label: "Manage LIA" }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="grid gap-4 px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Active LIAs</h1>
                    <p className="text-muted-foreground">
                      Manage your active LIA programs
                    </p>
                  </div>
                </div>

                <ActiveLiasManager
                  schoolId={profile.school_id}
                  educationPrograms={educationPrograms || []}
                  schoolLocations={schoolLocations || []}
                  initialEnrollmentCounts={enrollmentData}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 