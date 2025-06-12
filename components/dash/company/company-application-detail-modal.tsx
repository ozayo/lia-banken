'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, Mail, GraduationCap, Building2, Phone, MapPin, Download, ExternalLink, Github, Linkedin, BookOpen } from 'lucide-react'

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

interface CompanyApplicationDetailModalProps {
  application: CompanyApplication
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusLabels: Record<string, string> = {
  'waiting_for_answer': 'Pending',
  'rejected': 'Rejected',
  'accepted': 'Accepted'
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'waiting_for_answer': 'outline',
  'rejected': 'destructive',
  'accepted': 'default'
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

export function CompanyApplicationDetailModal({ application, open, onOpenChange }: CompanyApplicationDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCreatedAt = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStudentInitials = () => {
    const first = application.student.first_name?.charAt(0) || ''
    const last = application.student.last_name?.charAt(0) || ''
    return (first + last).toUpperCase() || 'S'
  }

  const getStudentFullName = () => {
    return `${application.student.first_name || ''} ${application.student.last_name || ''}`.trim() || 'Unknown Student'
  }

  const getCvDownloadUrl = () => {
    if (!application.student.cv_url) return null
    // Use the correct Supabase project URL
    return `https://ypltxllrpfqiyhrygogx.supabase.co/storage/v1/object/public/cvs/${application.student.cv_url}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getStudentInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-grow">
              <DialogTitle className="text-xl leading-tight mb-2">
                {getStudentFullName()}
              </DialogTitle>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-lg font-medium">Applied for: {application.job_posting.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusColors[application.status] || 'default'}>
                  {statusLabels[application.status] || application.status}
                </Badge>
                <Badge variant={workingTypeColors[application.job_posting.working_type] || 'outline'}>
                  {workingTypeLabels[application.job_posting.working_type] || application.job_posting.working_type}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Information */}
          <div>
            <h3 className="font-semibold mb-4">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${application.student.email}`}
                  className="text-primary hover:underline"
                >
                  {application.student.email}
                </a>
              </div>
              
              {application.student.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${application.student.phone}`}
                    className="text-primary hover:underline"
                  >
                    {application.student.phone}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>{application.student.school_name}</span>
              </div>

              {application.student.program_name && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{application.student.program_name}</span>
                </div>
              )}
            </div>

            {/* LIA Period */}
            {(application.student.lia_start_date && application.student.lia_end_date) && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">LIA Internship Period</h4>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(application.student.lia_start_date)} - {formatDate(application.student.lia_end_date)}
                  </span>
                </div>
              </div>
            )}

            {/* Links and CV */}
            <div className="mt-4 flex flex-wrap gap-3">
              {getCvDownloadUrl() && (
                <Button variant="outline" size="sm" asChild>
                  <a href={getCvDownloadUrl()!} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download CV
                  </a>
                </Button>
              )}
              
              {application.student.linkedin_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={application.student.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              
              {application.student.github_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={application.student.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
              
              {application.student.portfolio_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={application.student.portfolio_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Portfolio
                  </a>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Cover Letter */}
          {application.student.bio && (
            <div>
              <h3 className="font-semibold mb-3">Cover Letter / Bio</h3>
              <div className="text-sm bg-muted/50 p-4 rounded-lg">
                <p className="leading-relaxed whitespace-pre-wrap">{application.student.bio}</p>
              </div>
            </div>
          )}

          {application.cover_letter && application.cover_letter !== application.student.bio && (
            <div>
              <h3 className="font-semibold mb-3">Application Cover Letter</h3>
              <div className="text-sm bg-muted/30 p-4 rounded-lg border">
                <p className="leading-relaxed whitespace-pre-wrap">{application.cover_letter}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Application Timeline */}
          <div>
            <h3 className="font-semibold mb-3">Application Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Applied on {formatDate(application.applied_at)}</span>
              </div>

              {application.status !== 'waiting_for_answer' && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Status updated {formatDate(application.status_updated_at)}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{application.job_posting.application_count} total applications</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 