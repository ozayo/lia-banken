import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { JobPostingCard } from '@/components/dash/student/job-posting-card'
import { JobPostingCardSkeleton } from '@/components/dash/student/job-posting-card-skeleton'

interface JobPosting {
  id: string
  title: string
  description: string
  working_type: string
  has_flexible_duration: boolean
  start_date: string | null
  end_date: string | null
  status: string
  application_count: number
  created_at: string
  company_name: string | null
  company_website: string | null
  company_logo: string | null
  company_linkedin: string | null
  supervisor_name: string | null
  supervisor_email: string | null
  category_name: string | null
  county_name: string | null
  municipality_name: string | null
}

async function getJobPostings(): Promise<JobPosting[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('job_postings')
    .select(`
      id,
      title,
      description,
      working_type,
      has_flexible_duration,
      start_date,
      end_date,
      status,
      application_count,
      created_at,
      company_id,
      category_id,
      location_county_id,
      location_municipality_id,
      supervisor_id
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching job postings:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Get unique IDs for batch fetching
  const companyIds = [...new Set(data.map(item => item.company_id).filter(Boolean))]
  const categoryIds = [...new Set(data.map(item => item.category_id).filter(Boolean))]
  const countyIds = [...new Set(data.map(item => item.location_county_id).filter(Boolean))]
  const municipalityIds = [...new Set(data.map(item => item.location_municipality_id).filter(Boolean))]
  const supervisorIds = [...new Set(data.map(item => item.supervisor_id).filter(Boolean))]

  // Fetch related data in parallel
  const [companiesData, categoriesData, countiesData, municipalitiesData, supervisorsData] = await Promise.all([
    companyIds.length > 0 ? supabase
      .from('companies')
      .select('id, name, logo_url, website_url, linkedin_url')
      .in('id', companyIds) : Promise.resolve({ data: [] }),
    categoryIds.length > 0 ? supabase
      .from('education_categories')
      .select('id, name')
      .in('id', categoryIds) : Promise.resolve({ data: [] }),
    countyIds.length > 0 ? supabase
      .from('counties')
      .select('id, name')
      .in('id', countyIds) : Promise.resolve({ data: [] }),
    municipalityIds.length > 0 ? supabase
      .from('municipalities')
      .select('id, name')
      .in('id', municipalityIds) : Promise.resolve({ data: [] }),
    supervisorIds.length > 0 ? supabase
      .from('company_handledare')
      .select('id, first_name, last_name, email')
      .in('id', supervisorIds) : Promise.resolve({ data: [] })
  ])

  // Create lookup maps
  const companiesMap = new Map(companiesData.data?.map(c => [c.id, { name: c.name, website: c.website_url, logo: c.logo_url, linkedin: c.linkedin_url }]) || [])
  const categoriesMap = new Map(categoriesData.data?.map(c => [c.id, c.name]) || [])
  const countiesMap = new Map(countiesData.data?.map(c => [c.id, c.name]) || [])
  const municipalitiesMap = new Map(municipalitiesData.data?.map(m => [m.id, m.name]) || [])
  const supervisorsMap = new Map(supervisorsData.data?.map(s => [s.id, { 
    name: [s.first_name, s.last_name].filter(Boolean).join(' ').trim() || null, 
    email: s.email 
  }]) || [])

  // Transform the data
  return data.map((item: any) => {
    const companyData = companiesMap.get(item.company_id)
    const supervisorData = supervisorsMap.get(item.supervisor_id)
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      working_type: item.working_type,
      has_flexible_duration: item.has_flexible_duration,
      start_date: item.start_date,
      end_date: item.end_date,
      status: item.status,
      application_count: item.application_count,
      created_at: item.created_at,
      company_name: companyData?.name || null,
      company_website: companyData?.website || null,
      company_logo: companyData?.logo || null,
      company_linkedin: companyData?.linkedin || null,
      supervisor_name: supervisorData?.name || null,
      supervisor_email: supervisorData?.email || null,
      category_name: categoriesMap.get(item.category_id) || null,
      county_name: countiesMap.get(item.location_county_id) || null,
      municipality_name: municipalitiesMap.get(item.location_municipality_id) || null,
    }
  })
}

function JobPostingsGrid() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobPostingCardSkeleton key={i} />
        ))}
      </div>
    }>
      <JobPostingsList />
    </Suspense>
  )
}

async function JobPostingsList() {
  const jobPostings = await getJobPostings()

  if (jobPostings.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-muted-foreground">
          No internship positions available right now
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Check back later for new opportunities!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobPostings.map((job) => (
        <JobPostingCard key={job.id} job={job} />
      ))}
    </div>
  )
}

import { redirect } from "next/navigation"
import { StudentSidebar } from "@/components/dash/student/StudentSidebar"
import { StudentHeader } from "@/components/dash/student/StudentHeader"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default async function JobPostListPage() {
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <StudentHeader 
            breadcrumbs={[
              { label: "Dashboard", href: "/dashboard/student" },
              { label: "Find Internships", href: "/dashboard/student/job-post-list" }
            ]} 
          />
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Find Internships</h1>
                <p className="text-muted-foreground">
                  Browse available internship positions and apply today!
                </p>
              </div>
            </div>

            <JobPostingsGrid />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 