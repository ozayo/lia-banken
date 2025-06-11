import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompanySidebar } from "@/components/dash/company/CompanySidebar"
import { CompanyHeader } from "@/components/dash/company/CompanyHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyGeneralSettingsForm } from "@/components/dash/company/CompanyGeneralSettingsForm"
import { CompanyHandledareManager } from "@/components/dash/company/CompanyHandledareManager"

export default async function CompanySettingsPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has company role and get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id, first_name, last_name, phone")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  if (profile.role !== "company") {
    redirect("/") // Redirect to home if not a company user
  }

  if (!profile.company_id) {
    // If company admin doesn't have a company yet, something went wrong
    redirect("/auth/login")
  }

  // Get company information
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single()

  if (!company) {
    redirect("/auth/login")
  }

  // Get education categories
  const { data: educationCategories } = await supabase
    .from("education_categories")
    .select("id, name")
    .order("name")

  // Get all schools
  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .order("name")

  // Get all education programs  
  const { data: educationPrograms } = await supabase
    .from("education_programs")
    .select(`
      id, 
      name, 
      school_id,
      schools!inner(name)
    `)
    .order("name")

  // Get company's current settings
  const { data: companyCategories } = await supabase
    .from("company_categories")
    .select(`
      category_id,
      education_categories(id, name)
    `)
    .eq("company_id", profile.company_id)

  const { data: companySchools } = await supabase
    .from("company_schools")
    .select(`
      school_id,
      schools(id, name)
    `)
    .eq("company_id", profile.company_id)

  const { data: companyEducationPrograms } = await supabase
    .from("company_education_programs")
    .select(`
      education_program_id,
      education_programs(id, name, school_id)
    `)
    .eq("company_id", profile.company_id)

  // Get company handledare
  const { data: handledare } = await supabase
    .from("company_handledare")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("first_name")

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'Şirket'} ${profile.last_name || 'Admin'}`,
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
              
              <div className="px-4 lg:px-6">
                <div className="grid gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
                    <p className="text-muted-foreground">
                      Manage your LIA application preferences and supervisor information.
                    </p>
                  </div>
                  
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="general">General Settings</TabsTrigger>
                      <TabsTrigger value="handledare">Handledare</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>LIA Application Preferences</CardTitle>
                          <CardDescription>
                            Configure which categories, schools, and education programs you accept LIA applications from.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <CompanyGeneralSettingsForm 
                            companyId={company.id}
                            educationCategories={educationCategories || []}
                            schools={schools || []}
                            educationPrograms={educationPrograms || []}
                            currentCategories={companyCategories?.map(cc => cc.category_id) || []}
                            currentSchools={companySchools?.map(cs => cs.school_id) || []}
                            currentEducationPrograms={companyEducationPrograms?.map(cep => cep.education_program_id) || []}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="handledare" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Handledare (Supervisors)</CardTitle>
                          <CardDescription>
                            Manage your company's LIA supervisors and their contact information.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <CompanyHandledareManager 
                            companyId={company.id}
                            handledare={handledare || []}
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