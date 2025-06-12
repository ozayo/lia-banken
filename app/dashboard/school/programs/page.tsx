import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SchoolSidebar } from "@/components/dash/school/SchoolSidebar"
import { SchoolHeader } from "@/components/dash/school/SchoolHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { EducationProgramsManager } from "@/components/dash/school/EducationProgramsManager"

export default async function EducationProgramsPage() {
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

  // Get education programs
  const { data: programs } = await supabase
    .from("education_programs")
    .select(`
      *,
      category:education_categories!education_programs_category_id_fkey(id, name)
    `)
    .eq("school_id", profile.school_id)
    .order("name")

  // Get education categories for dropdown
  const { data: categories } = await supabase
    .from("education_categories")
    .select("id, name")
    .order("name")

  // Get school locations for location selection
  const { data: locations } = await supabase
    .from("school_locations")
    .select("id, name")
    .eq("school_id", profile.school_id)
    .order("name")

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
        <SchoolHeader breadcrumbs={[{ label: "Manage Programs" }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              <div className="px-4 lg:px-6">
                <div className="grid gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Education Programs</h1>
                    <p className="text-muted-foreground">
                      Manage and organize your school's education programs.
                    </p>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Program Management</CardTitle>
                      <CardDescription>
                        Add, edit and delete your education programs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EducationProgramsManager 
                        schoolId={profile.school_id}
                        programs={programs || []}
                        categories={categories || []}
                        locations={locations || []}
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