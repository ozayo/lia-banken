import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { CompanySidebar } from '@/components/dash/company/CompanySidebar'
import { CompanyHeader } from '@/components/dash/company/CompanyHeader'
import { CompanyApplicationCard } from '@/components/dash/company/company-application-card'
import { CompanyApplicationCardSkeleton } from '@/components/dash/company/company-application-card-skeleton'
import { createClient } from '@/lib/supabase/server'

interface CompanyApplication {
  id: string
  status: string
  applied_at: string
  status_updated_at: string
  cover_letter: string | null
  interview_date: string | null
  interview_notes: string | null
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    school_name: string
    program_name: string
    bio: string
    cv_url: string
    linkedin_url: string
    github_url: string
    portfolio_url: string
    lia_start_date: string | null
    lia_end_date: string | null
  }
  job_posting: {
    id: string
    title: string
    description: string
    working_type: string
    has_flexible_duration: boolean
    start_date: string | null
    end_date: string | null
    application_count: number
    created_at: string
  }
  school: {
    id: string
    name: string
  } | null
}

interface StudentData {
  student_id: string
  first_name: string
  last_name: string
  email: string
}

async function getCompanyApplications(): Promise<CompanyApplication[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Get user's company
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile?.company_id) return []
  
  // Get applications with basic data first
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      applied_at,
      status_updated_at,
      cover_letter,
      interview_date,
      interview_notes,
      student_id,
      job_posting_id,
      school_id
    `)
    .eq('company_id', profile.company_id)
    .order('applied_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    return []
  }

  if (!applications || applications.length === 0) {
    return []
  }

  // Get unique IDs for batch fetching
  const jobPostingIds = [...new Set(applications.map(app => app.job_posting_id).filter(Boolean))]
  const schoolIds = [...new Set(applications.map(app => app.school_id).filter(Boolean))]

  // Fetch related data - use published student profiles
  const [studentsResult, jobPostingsResult, schoolsResult] = await Promise.all([
    // Get published student profiles for students who applied
    supabase
      .from('published_student_profiles')
      .select('student_id, first_name, last_name, email, phone, school_name, program_name, bio, cv_url, linkedin_url, github_url, portfolio_url, lia_start_date, lia_end_date')
      .in('student_id', applications.map(app => app.student_id))
      .eq('is_published', true),
    jobPostingIds.length > 0 ? supabase
      .from('job_postings')
      .select('id, title, description, working_type, has_flexible_duration, start_date, end_date, application_count, created_at')
      .in('id', jobPostingIds) : { data: [], error: null },
    schoolIds.length > 0 ? supabase
      .from('schools')
      .select('id, name')
      .in('id', schoolIds) : { data: [], error: null }
  ])

  // Debug logging
  console.log('Published Students result:', studentsResult)
  console.log('Published Students error:', studentsResult.error)
  console.log('Published Students data:', studentsResult.data)

  // Create lookup maps - use published profile data
  const studentsData = (studentsResult.data) || []
  const studentsMap = new Map(studentsData.map((s: any) => [s.student_id, s]))
  const jobPostingsMap = new Map((jobPostingsResult.data || []).map(jp => [jp.id, jp]))
  const schoolsMap = new Map((schoolsResult.data || []).map(s => [s.id, s]))

  // Transform the data
  return applications.map((app) => {
    const student = studentsMap.get(app.student_id)
    const jobPosting = jobPostingsMap.get(app.job_posting_id)
    const school = schoolsMap.get(app.school_id)
    
    return {
      id: app.id,
      status: app.status,
      applied_at: app.applied_at,
      status_updated_at: app.status_updated_at,
      cover_letter: app.cover_letter,
      interview_date: app.interview_date,
      interview_notes: app.interview_notes,
      student: {
        id: app.student_id || '',
        first_name: student?.first_name || 'Öğrenci',
        last_name: student?.last_name || '',
        email: student?.email || 'Öğrenci Bilgisi',
        phone: student?.phone || '',
        school_name: student?.school_name || '',
        program_name: student?.program_name || '',
        bio: student?.bio || '',
        cv_url: student?.cv_url || '',
        linkedin_url: student?.linkedin_url || '',
        github_url: student?.github_url || '',
        portfolio_url: student?.portfolio_url || '',
        lia_start_date: student?.lia_start_date || null,
        lia_end_date: student?.lia_end_date || null
      },
      job_posting: jobPosting || {
        id: app.job_posting_id || '',
        title: 'Unknown Position',
        description: 'No description available',
        working_type: 'On-site',
        has_flexible_duration: false,
        start_date: null,
        end_date: null,
        application_count: 0,
        created_at: app.applied_at
      },
      school: school || null
    }
  })
}

function ApplicationsGrid({ status }: { status?: string }) {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CompanyApplicationCardSkeleton key={i} />
        ))}
      </div>
    }>
      <ApplicationsList status={status} />
    </Suspense>
  )
}

async function ApplicationsList({ status }: { status?: string }) {
  const applications = await getCompanyApplications()

  // Filter by status if provided
  const filteredApplications = status 
    ? applications.filter(app => app.status === status)
    : applications

  if (filteredApplications.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground">
          {status ? `No ${status.replace('_', ' ')} applications` : 'No applications yet'}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {status ? 'Check other tabs for more applications.' : 'Applications will appear here when students apply to your job postings.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredApplications.map((application) => (
        <CompanyApplicationCard key={application.id} application={application} />
      ))}
    </div>
  )
}

export default async function CompanyApplicationsPage() {
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
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      role, 
      company_id,
      first_name, 
      last_name
    `)
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "company") {
    redirect("/auth/login")
  }

  // Get company information
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .single()

  if (!company) {
    redirect("/auth/login")
  }

  const sidebarUser = {
    name: `${profile.first_name || 'Company'} ${profile.last_name || 'Admin'}`.trim(),
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
          company={company}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard/company" },
            { label: "Applications", href: "/dashboard/company/applications" }
          ]} 
        />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                <p className="text-muted-foreground">
                  Review and manage student applications for your job postings.
                </p>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Applications</TabsTrigger>
                <TabsTrigger value="waiting_for_answer">Pending</TabsTrigger>
                <TabsTrigger value="accepted">Accepted</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                <ApplicationsGrid />
              </TabsContent>
              
              <TabsContent value="waiting_for_answer" className="space-y-4">
                <ApplicationsGrid status="waiting_for_answer" />
              </TabsContent>
              
              <TabsContent value="accepted" className="space-y-4">
                <ApplicationsGrid status="accepted" />
              </TabsContent>
              
              <TabsContent value="rejected" className="space-y-4">
                <ApplicationsGrid status="rejected" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 