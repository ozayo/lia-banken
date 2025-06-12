'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Building2, Briefcase, Eye, Send } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { JobPostingDetailModal } from './job-posting-detail-modal'

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
  company_id: string | null
  company_name: string | null
  company_website: string | null
  company_logo: string | null
  company_linkedin: string | null
  supervisor_name: string | null
  supervisor_email: string | null
  category_name: string | null
  county_name: string | null
  municipality_name: string | null
  has_applied: boolean
}

interface JobPostingCardProps {
  job: JobPosting
}

const workingTypeLabels: Record<string, string> = {
  'On-site': 'On-site',
  'Distance': 'Remote',
  'Hybrid': 'Hybrid'
}

const workingTypeColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'On-site': 'default',
  'Distance': 'secondary',
  'Hybrid': 'outline'
}

export function JobPostingCard({ job }: JobPostingCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const handleApplyNow = async () => {
    if (!job.company_id) {
      toast.error('Company information is missing')
      return
    }

    setIsApplying(true)
    
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('You must be logged in to apply')
        return
      }

      // Get student profile with school_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, school_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'student') {
        toast.error('Student profile not found')
        return
      }

      if (!profile.school_id) {
        toast.error('School information is missing from your profile')
        return
      }

      // Check if already applied
      const { data: existingApplication, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', user.id)
        .eq('job_posting_id', job.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing application:', checkError)
        toast.error('Error checking application status')
        return
      }

      if (existingApplication) {
        toast.error('You have already applied to this position')
        return
      }

      // Create application
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          student_id: user.id,
          job_posting_id: job.id,
          company_id: job.company_id,
          school_id: profile.school_id,
          status: 'waiting_for_answer'
        })

      if (insertError) {
        console.error('Error creating application:', insertError)
        toast.error('Failed to submit application')
        return
      }

      // Update job posting application count
      const { error: updateError } = await supabase
        .from('job_postings')
        .update({ 
          application_count: job.application_count + 1 
        })
        .eq('id', job.id)

      if (updateError) {
        console.error('Error updating application count:', updateError)
        // Don't show error to user as the application was successful
      }

      toast.success('Application submitted successfully!')
      
      // Wait a bit for toast to show, then refresh
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsApplying(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex p-6 gap-6">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 overflow-hidden pt-3">
              {job.company_logo ? (
                <img 
                  src={job.company_logo} 
                  alt={job.company_name || 'Company'} 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  {job.company_name ? job.company_name.charAt(0).toUpperCase() : 'C'}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0 flex-grow">
                <h3 className="text-xl font-semibold leading-tight mb-1">{job.title}</h3>
                {job.company_name && (
                  <p className="text-muted-foreground font-medium">{job.company_name}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Badge variant={workingTypeColors[job.working_type] || 'default'}>
                  {workingTypeLabels[job.working_type] || job.working_type}
                </Badge>
                {job.category_name && (
                  <Badge variant="outline" className="text-xs">
                    {job.category_name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Job Info */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
              {(job.county_name || job.municipality_name) && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {[job.municipality_name, job.county_name].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {job.has_flexible_duration ? 
                    'Flexible start date' : 
                    job.start_date ? 
                      `Starts ${formatDate(job.start_date)}` : 
                      'Date not specified'
                  }
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{job.application_count} applications</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {truncateDescription(job.description, 200)}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDetailModal(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button 
                size="sm"
                onClick={handleApplyNow}
                disabled={isApplying || job.has_applied}
                variant={job.has_applied ? "secondary" : "default"}
              >
                <Send className="h-4 w-4 mr-2" />
                {job.has_applied ? 'Applied' : isApplying ? 'Applying...' : 'Apply Now'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <JobPostingDetailModal 
        job={job}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </>
  )
} 