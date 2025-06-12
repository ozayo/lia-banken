import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SchoolSidebar } from "@/components/dash/school/SchoolSidebar"
import { SchoolHeader } from "@/components/dash/school/SchoolHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SchoolProfileForm } from "@/components/dash/school/SchoolProfileForm"

export default async function SchoolProfilePage() {
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

  // Get school details
  const { data: school } = await supabase
    .from("schools")
    .select(`
      *,
      address_county:counties!schools_address_county_id_fkey(id, name),
      address_municipality:municipalities!schools_address_municipality_id_fkey(id, name)
    `)
    .eq("id", profile.school_id)
    .single()

  if (!school) {
    redirect("/auth/login")
  }

  // Get counties and municipalities for dropdowns
  const { data: counties } = await supabase
    .from("counties")
    .select("id, name, code")
    .order("name")

  const { data: municipalities } = await supabase
    .from("municipalities") 
    .select("id, name, code, county_id")
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
        <SchoolHeader breadcrumbs={[{ label: "School Profile" }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              <div className="px-4 lg:px-6">
                <div className="grid gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">School Profile</h1>
                    <p className="text-muted-foreground">
                      Update and manage your school's information.
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>School Information</CardTitle>
                        <CardDescription>
                          Edit your school's basic information and contact details.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SchoolProfileForm 
                          school={school}
                          counties={counties || []}
                          municipalities={municipalities || []}
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