import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompanySidebar } from "@/components/dash/company/CompanySidebar"
import { CompanyHeader } from "@/components/dash/company/CompanyHeader"
import { JobPostingsManager } from "@/components/dash/company/JobPostingsManager"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function JobPostingsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile and company information
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      companies!inner(*)
    `)
    .eq("id", user.id)
    .single()

  if (!profile || !profile.companies) {
    redirect("/auth/login")
  }

  // Check if user has company role
  if (profile.role !== "company") {
    redirect("/")
  }

  // Get education categories for the form
  const { data: educationCategories } = await supabase
    .from("education_categories")
    .select("*")
    .order("name")

  // Get company supervisors for the form
  const { data: supervisors } = await supabase
    .from("company_handledare")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("first_name")

  // Get counties and municipalities for location selection
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
    name: `${profile.first_name || 'Company'} ${profile.last_name || 'Admin'}`,
    email: user.email!,
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <CompanySidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <CompanyHeader 
          user={user} 
          profile={profile} 
          company={profile.companies} 
          breadcrumbs={[{ label: "LIA Job Postings" }]} 
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="grid gap-4 px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">LIA Job Postings</h1>
                    <p className="text-muted-foreground">
                      Manage your LIA internship opportunities
                    </p>
                  </div>
                </div>

                <JobPostingsManager
                  companyId={profile.company_id}
                  educationCategories={educationCategories || []}
                  supervisors={supervisors || []}
                  counties={counties || []}
                  municipalities={municipalities || []}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 