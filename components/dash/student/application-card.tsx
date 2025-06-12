'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, Building2, Eye, Clock, User, Mail, Globe, ExternalLink, Linkedin } from 'lucide-react'
import { ApplicationDetailModal } from './application-detail-modal'

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

interface ApplicationCardProps {
  application: Application
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

export function ApplicationCard({ application }: ApplicationCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0 flex-grow">
                <h3 className="text-xl font-semibold leading-tight mb-1">
                  {application.job_posting.title}
                </h3>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-muted-foreground font-medium">
                    {application.company.name}
                  </p>
                  <div className="flex gap-2">
                    {application.company.website_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={application.company.website_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {application.company.linkedin_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={application.company.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Badge variant={statusColors[application.status] || 'default'}>
                  {statusLabels[application.status] || application.status}
                </Badge>
                <Badge variant={workingTypeColors[application.job_posting.working_type] || 'outline'}>
                  {workingTypeLabels[application.job_posting.working_type] || application.job_posting.working_type}
                </Badge>
              </div>
            </div>

            {/* Application Info */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Applied {formatDate(application.applied_at)}</span>
              </div>

              {application.status !== 'waiting_for_answer' && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Updated {formatDate(application.status_updated_at)}</span>
                </div>
              )}

              {application.interview_date && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Interview: {formatDateTime(application.interview_date)}</span>
                </div>
              )}
            </div>

            {/* Job Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {truncateDescription(application.job_posting.description, 200)}
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
            </div>
          </div>
        </div>
      </Card>

      <ApplicationDetailModal 
        application={application}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </>
  )
} 