'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, Globe, ExternalLink, Linkedin, User, Mail, Building2 } from 'lucide-react'

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

interface ApplicationDetailModalProps {
  application: Application
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusLabels: Record<string, string> = {
  'waiting_for_answer': 'Waiting for Answer',
  'rejected': 'Rejected',
  'interview_scheduled': 'Interview Scheduled',
  'accepted': 'Accepted'
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'waiting_for_answer': 'outline',
  'rejected': 'destructive',
  'interview_scheduled': 'secondary',
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

export function ApplicationDetailModal({ application, open, onOpenChange }: ApplicationDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCreatedAt = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
              {application.company.logo_url ? (
                <img 
                  src={application.company.logo_url} 
                  alt={application.company.name} 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  {application.company.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="flex-grow">
              <DialogTitle className="text-xl leading-tight mb-2">
                {application.job_posting.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-lg font-medium">{application.company.name}</p>
                <div className="flex gap-2">
                  {application.company.website_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={application.company.website_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-1" />
                        Website
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  {application.company.linkedin_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={application.company.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4 mr-1" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Applied on {formatDate(application.applied_at)}</span>
            </div>

            {application.status !== 'waiting_for_answer' && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Status updated {formatDate(application.status_updated_at)}</span>
              </div>
            )}

            {application.interview_date && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Interview: {formatDateTime(application.interview_date)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{application.job_posting.application_count} total applications</span>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Job Description</h3>
            <div className="text-sm text-muted-foreground space-y-3">
              {application.job_posting.description.split('\n').map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Position Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {application.job_posting.has_flexible_duration ? 
                    'Flexible start date' : 
                    application.job_posting.start_date ? 
                      `Starts ${formatDate(application.job_posting.start_date)}` : 
                      'Date not specified'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Posted {formatCreatedAt(application.job_posting.created_at)}</span>
              </div>
            </div>
          </div>

          {application.supervisor && (application.supervisor.name || application.supervisor.email) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Contact Person</h3>
                <div className="flex flex-row gap-2 items-center">
                  {application.supervisor.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{application.supervisor.name}</span>
                    </div>
                  )}
                  {application.supervisor.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${application.supervisor.email}`}
                        className="text-primary hover:underline"
                      >
                        {application.supervisor.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {application.interview_notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Interview Notes</h3>
                <div className="text-sm text-muted-foreground">
                  <p className="leading-relaxed">{application.interview_notes}</p>
                </div>
              </div>
            </>
          )}
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