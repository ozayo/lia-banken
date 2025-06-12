'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
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

interface ApplicationStatusUpdateModalProps {
  application: CompanyApplication
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusLabels: Record<string, string> = {
  'waiting_for_answer': 'Pending',
  'rejected': 'Rejected',
  'interview_scheduled': 'Interview Scheduled',
  'accepted': 'Accepted'
}

const statusOptions = [
  { value: 'waiting_for_answer', label: 'Pending' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' }
]

export function ApplicationStatusUpdateModal({ application, open, onOpenChange }: ApplicationStatusUpdateModalProps) {
  const [status, setStatus] = useState(application.status)
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(
    application.interview_date ? new Date(application.interview_date) : undefined
  )
  const [interviewTime, setInterviewTime] = useState(
    application.interview_date ? format(new Date(application.interview_date), 'HH:mm') : '10:00'
  )
  const [interviewNotes, setInterviewNotes] = useState(application.interview_notes || '')
  const [isLoading, setIsLoading] = useState(false)

  const getStudentInitials = () => {
    const first = application.student.first_name?.charAt(0) || ''
    const last = application.student.last_name?.charAt(0) || ''
    return (first + last).toUpperCase() || 'S'
  }

  const getStudentFullName = () => {
    return `${application.student.first_name || ''} ${application.student.last_name || ''}`.trim() || 'Unknown Student'
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      // Prepare update data
      const updateData: any = {
        status,
        status_updated_at: new Date().toISOString(),
        interview_notes: interviewNotes || null
      }

      // Add interview date if status is interview_scheduled and date is selected
      if (status === 'interview_scheduled' && interviewDate && interviewTime) {
        const [hours, minutes] = interviewTime.split(':')
        const combinedDateTime = new Date(interviewDate)
        combinedDateTime.setHours(parseInt(hours), parseInt(minutes))
        updateData.interview_date = combinedDateTime.toISOString()
      } else if (status !== 'interview_scheduled') {
        // Clear interview date if status is not interview_scheduled
        updateData.interview_date = null
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', application.id)

      if (error) {
        console.error('Error updating application:', error)
        toast.error('Failed to update application status')
        return
      }

      toast.success('Application status updated successfully')
      onOpenChange(false)
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Error updating application:', error)
      toast.error('Failed to update application status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (newStatus: string) => {
    setStatus(newStatus)
    if (newStatus !== 'interview_scheduled') {
      setInterviewDate(undefined)
      setInterviewTime('10:00')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getStudentInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-grow">
              <DialogTitle className="text-lg leading-tight mb-1">
                Update Application Status
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {getStudentFullName()} - {application.job_posting.title}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions for Pending Applications */}
          {application.status === 'waiting_for_answer' && (
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleQuickAction('accepted')}
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleQuickAction('interview_scheduled')}
                  className="flex-1"
                >
                  Schedule Interview
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleQuickAction('rejected')}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Application Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview Date & Time (only show if interview_scheduled) */}
          {status === 'interview_scheduled' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Interview Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !interviewDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {interviewDate ? format(interviewDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={interviewDate}
                      onSelect={setInterviewDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Interview Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Interview Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {status === 'interview_scheduled' ? 'Interview Notes' : 'Notes'}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                status === 'interview_scheduled' 
                  ? "Add notes about the interview..." 
                  : "Add any notes about this application..."
              }
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || (status === 'interview_scheduled' && !interviewDate)}
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 