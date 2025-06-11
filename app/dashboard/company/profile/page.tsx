import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompanySidebar } from "@/components/dash/company/CompanySidebar"
import { CompanyHeader } from "@/components/dash/company/CompanyHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { CompanyProfileForm } from "@/components/dash/company/CompanyProfileForm"

export default async function CompanyProfilePage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user }
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

  // Get company details
  const { data: company } = await supabase
    .from("companies")
    .select(`
      *,
      address_county:counties!companies_address_county_id_fkey(id, name),
      address_municipality:municipalities!companies_address_municipality_id_fkey(id, name)
    `)
    .eq("id", profile.company_id)
    .single()

  if (!company) {
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
    name: `${profile.first_name || 'Company'} ${profile.last_name || 'Admin'}`,
    email: user.email!, // We know email exists since user is authenticated
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <CompanySidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <CompanyHeader user={user} profile={profile} company={company} breadcrumbs={[{ label: "Company Profile" }]} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              <div className="px-4 lg:px-6">
                <div className="grid gap-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
                    <p className="text-muted-foreground">
                      Update and manage your company information.
                    </p>
                  </div>
                  
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                        <CardDescription>
                          Edit your company&apos;s basic information and contact details.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CompanyProfileForm 
                          company={company}
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