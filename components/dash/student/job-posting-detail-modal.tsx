'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Calendar, MapPin, Building2, Briefcase, Send, Users, Clock, ExternalLink, Globe, Linkedin, User, Mail } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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

interface JobPostingDetailModalProps {
  job: JobPosting
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function JobPostingDetailModal({ job, open, onOpenChange }: JobPostingDetailModalProps) {
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
      onOpenChange(false)
      
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
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCreatedAt = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
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
            
            <div className="flex-grow">
              <DialogTitle className="text-xl leading-tight mb-2">
                {job.title}
              </DialogTitle>
              {job.company_name && (
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-lg font-medium">{job.company_name}</p>
                  <div className="flex gap-2">
                    {job.company_website && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={job.company_website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-1" />
                          Website
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                    {job.company_linkedin && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={job.company_linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4 mr-1" />
                          LinkedIn
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant={workingTypeColors[job.working_type] || 'default'}>
                  {workingTypeLabels[job.working_type] || job.working_type}
                </Badge>
                {job.category_name && (
                  <Badge variant="outline">
                    {job.category_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location and Job Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(job.county_name || job.municipality_name) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[job.municipality_name, job.county_name].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {job.has_flexible_duration ? 
                  'Flexible start date' : 
                  job.start_date ? 
                    `Starts ${formatDate(job.start_date)}` : 
                    'Date not specified'
                }
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{job.application_count} applications</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Published {formatCreatedAt(job.created_at)}</span>
            </div>
          </div>

          <Separator />

          {/* Job Description */}
          <div>
            <h3 className="font-semibold mb-3">Description</h3>
            <div className="text-sm text-muted-foreground space-y-3">
              {job.description.split('\n').map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Supervisor Info */}
          {(job.supervisor_name || job.supervisor_email) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Handledare</h3>
                <div className="flex flex-row gap-2 items-center">
                  {job.supervisor_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{job.supervisor_name}</span>
                    </div>
                  )}
                  {job.supervisor_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${job.supervisor_email}`}
                        className="text-primary hover:underline"
                      >
                        {job.supervisor_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button 
            onClick={handleApplyNow}
            disabled={isApplying || job.has_applied}
            variant={job.has_applied ? "secondary" : "default"}
            className="min-w-32"
          >
            <Send className="h-4 w-4 mr-2" />
            {job.has_applied ? 'Applied' : isApplying ? 'Applying...' : 'Apply Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 