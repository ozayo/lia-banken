import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StudentSidebar } from "@/components/dash/student/StudentSidebar"
import { StudentHeader } from "@/components/dash/student/StudentHeader"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ApplicationCard } from "@/components/dash/student/application-card"
import { ApplicationCardSkeleton } from "@/components/dash/student/application-card-skeleton"

interface Application {
  id: string
  status: string
  applied_at: string
  status_updated_at: string
  cover_letter: string | null
  interview_date: string | null
  interview_notes: string | null
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
  company: {
    id: string
    name: string
    logo_url: string | null
    website_url: string | null
    linkedin_url: string | null
  }
  supervisor: {
    name: string | null
    email: string | null
  } | null
}

async function getStudentApplications(): Promise<Application[]> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      applied_at,
      status_updated_at,
      cover_letter,
      interview_date,
      interview_notes,
      job_posting_id,
      company_id
    `)
    .eq('student_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Get unique IDs for batch fetching
  const jobPostingIds = [...new Set(data.map(item => item.job_posting_id).filter(Boolean))]
  const companyIds = [...new Set(data.map(item => item.company_id).filter(Boolean))]

  // Fetch related data in parallel
  const [jobPostingsData, companiesData] = await Promise.all([
    jobPostingIds.length > 0 ? supabase
      .from('job_postings')
      .select(`
        id,
        title,
        description,
        working_type,
        has_flexible_duration,
        start_date,
        end_date,
        application_count,
        created_at,
        supervisor_id
      `)
      .in('id', jobPostingIds) : Promise.resolve({ data: [] }),
    companyIds.length > 0 ? supabase
      .from('companies')
      .select('id, name, logo_url, website_url, linkedin_url')
      .in('id', companyIds) : Promise.resolve({ data: [] })
  ])

  // Get supervisor IDs from job postings
  const supervisorIds = [...new Set(jobPostingsData.data?.map(jp => jp.supervisor_id).filter(Boolean) || [])]
  
  // Fetch supervisors if any exist
  const supervisorsData = supervisorIds.length > 0 ? await supabase
    .from('company_handledare')
    .select('id, first_name, last_name, email')
    .in('id', supervisorIds) : { data: [] }

  // Create lookup maps
  const jobPostingsMap = new Map(jobPostingsData.data?.map(jp => [jp.id, jp]) || [])
  const companiesMap = new Map(companiesData.data?.map(c => [c.id, c]) || [])
  const supervisorsMap = new Map(supervisorsData.data?.map(s => [s.id, {
    name: [s.first_name, s.last_name].filter(Boolean).join(' ').trim() || null,
    email: s.email
  }]) || [])

  // Transform the data
  return data.map((item: any) => {
    const jobPosting = jobPostingsMap.get(item.job_posting_id)
    const company = companiesMap.get(item.company_id)
    const supervisor = jobPosting?.supervisor_id ? supervisorsMap.get(jobPosting.supervisor_id) : null
    
    return {
      id: item.id,
      status: item.status,
      applied_at: item.applied_at,
      status_updated_at: item.status_updated_at,
      cover_letter: item.cover_letter,
      interview_date: item.interview_date,
      interview_notes: item.interview_notes,
      job_posting: jobPosting || {
        id: '',
        title: 'Unknown Position',
        description: '',
        working_type: '',
        has_flexible_duration: false,
        start_date: null,
        end_date: null,
        application_count: 0,
        created_at: ''
      },
      company: company || {
        id: '',
        name: 'Unknown Company',
        logo_url: null,
        website_url: null,
        linkedin_url: null
      },
      supervisor: supervisor || null
    }
  })
}

function ApplicationsGrid() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ApplicationCardSkeleton key={i} />
        ))}
      </div>
    }>
      <ApplicationsList />
    </Suspense>
  )
}

async function ApplicationsList() {
  const applications = await getStudentApplications()

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground">
          No applications yet
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Start applying to internship positions to see them here!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  )
}

export default async function MyApplicationsPage() {
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
      last_name
    `)
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "student") {
    redirect("/auth/login")
  }

  const sidebarUser = {
    name: `${profile.first_name || 'Student'} ${profile.last_name || ''}`.trim(),
    email: user.email!,
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <StudentSidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
          <StudentHeader 
            breadcrumbs={[
              { label: "Dashboard", href: "/dashboard/student" },
              { label: "My Applications", href: "/dashboard/student/my-applications" }
            ]} 
          />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <ApplicationsGrid />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 