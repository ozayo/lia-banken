'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, User, Mail, GraduationCap, Eye, Check, X, BookOpen } from 'lucide-react'
import { CompanyApplicationDetailModal } from './company-application-detail-modal'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

interface CompanyApplicationCardProps {
  application: CompanyApplication
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

export function CompanyApplicationCard({ application }: CompanyApplicationCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  const getStudentInitials = () => {
    const first = application.student.first_name?.charAt(0) || ''
    const last = application.student.last_name?.charAt(0) || ''
    return (first + last).toUpperCase() || 'S'
  }

  const getStudentFullName = () => {
    return `${application.student.first_name || ''} ${application.student.last_name || ''}`.trim() || 'Unknown Student'
  }

  const getInternshipDateRange = () => {
    if (application.student.lia_start_date && application.student.lia_end_date) {
      const startDate = formatDate(application.student.lia_start_date)
      const endDate = formatDate(application.student.lia_end_date)
      return `${startDate} - ${endDate}`
    }
    return 'LIA dates not specified'
  }

  const handleQuickAccept = async () => {
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'accepted',
          status_updated_at: new Date().toISOString()
        })
        .eq('id', application.id)

      if (error) {
        console.error('Error accepting application:', error)
        toast.error('Failed to accept application')
        return
      }

      toast.success('Application accepted successfully')
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Error accepting application:', error)
      toast.error('Failed to accept application')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReject = async () => {
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'rejected',
          status_updated_at: new Date().toISOString()
        })
        .eq('id', application.id)

      if (error) {
        console.error('Error rejecting application:', error)
        toast.error('Failed to reject application')
        return
      }

      toast.success('Application rejected')
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error('Failed to reject application')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex p-6 gap-6">
        <div className="flex-shrink-0">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getStudentInitials()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-grow">
              <h3 className="text-xl font-semibold leading-tight mb-1">
                {getStudentFullName()}
              </h3>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-muted-foreground font-medium">
                  Applied for: {application.job_posting.title}
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <a 
                    href={`mailto:${application.student.email}`}
                    className="text-primary hover:underline"
                  >
                    {application.student.email}
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>{application.student.school_name}</span>
                </div>
                {application.student.program_name && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{application.student.program_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Internship period: {getInternshipDateRange()}</span>
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

          <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Applied {formatDate(application.applied_at)}</span>
            </div>

            {application.status !== 'waiting_for_answer' && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Updated {formatDate(application.status_updated_at)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetailModal(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>

            {application.status === 'waiting_for_answer' && (
              <>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleQuickAccept}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isLoading ? 'Processing...' : 'Accept'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleQuickReject}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {isLoading ? 'Processing...' : 'Reject'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <CompanyApplicationDetailModal
        application={application}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </Card>
  )
}
