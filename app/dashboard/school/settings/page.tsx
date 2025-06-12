import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SchoolSidebar } from "@/components/dash/school/SchoolSidebar"
import { SchoolHeader } from "@/components/dash/school/SchoolHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SchoolDomainsForm } from "@/components/dash/school/SchoolDomainsForm"
import { SchoolLocationsManager } from "@/components/dash/school/SchoolLocationsManager"

export default async function SchoolSettingsPage() {
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
    .select("*")
    .eq("id", profile.school_id)
    .single()

  if (!school) {
    redirect("/auth/login")
  }

  // Get school locations
  const { data: locations } = await supabase
    .from("school_locations")
    .select(`
      *,
      address_county:counties!school_locations_address_county_id_fkey(id, name),
      address_municipality:municipalities!school_locations_address_municipality_id_fkey(id, name)
    `)
    .eq("school_id", profile.school_id)
    .order("name")

  // Get counties and municipalities for location dropdowns
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
        <SchoolHeader breadcrumbs={[{ label: "Settings" }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              <div className="px-4 lg:px-6">
                <div className="grid gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">School Settings</h1>
                    <p className="text-muted-foreground">
                      Manage your school's domain and location settings.
                    </p>
                  </div>
                  
                  <Tabs defaultValue="domains" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="domains">Student Domains</TabsTrigger>
                      <TabsTrigger value="locations">School Locations</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="domains" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Student Email Domains</CardTitle>
                          <CardDescription>
                            Manage the email domain(s) that students can register with. 
                            Students can only register with email addresses from these domains.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SchoolDomainsForm 
                            schoolId={school.id}
                            currentDomains={school.allowed_domains || []}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="locations" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>School Locations</CardTitle>
                          <CardDescription>
                            Manage your school's different campus or education locations.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SchoolLocationsManager 
                            schoolId={school.id}
                            locations={locations || []}
                            counties={counties || []}
                            municipalities={municipalities || []}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 