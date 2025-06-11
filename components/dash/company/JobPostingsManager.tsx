"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Edit, 
  Archive, 
  Trash2, 
  Save, 
  Calendar,
  MapPin,
  User,
  Briefcase,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface JobPosting {
  id: string
  company_id: string
  title: string
  category_id: number
  description?: string
  working_type: 'Plats' | 'Distance' | 'Hybrid'
  has_flexible_duration: boolean
  start_date?: string
  end_date?: string
  location_county_id?: number
  location_municipality_id?: number
  supervisor_id?: string
  status: 'active' | 'archived' | 'draft'
  application_count: number
  created_at: string
  updated_at: string
  education_categories?: { id: number; name: string }
  counties?: { id: number; name: string }
  municipalities?: { id: number; name: string }
  company_handledare?: { id: string; first_name: string; last_name: string }
}

interface JobPostingFormData {
  title: string
  category_id: string
  description: string
  working_type: 'Plats' | 'Distance' | 'Hybrid'
  has_flexible_duration: boolean
  start_date: string
  end_date: string
  location_county_id: string
  location_municipality_id: string
  supervisor_id: string
}

interface JobPostingsManagerProps {
  companyId: string
  educationCategories: Array<{ id: number; name: string }>
  supervisors: Array<{ id: string; first_name: string; last_name: string; email: string }>
  counties: Array<{ id: number; name: string; code: string }>
  municipalities: Array<{ id: number; name: string; code: string; county_id: number }>
}

export function JobPostingsManager({ 
  companyId, 
  educationCategories, 
  supervisors,
  counties,
  municipalities 
}: JobPostingsManagerProps) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [hideArchived, setHideArchived] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null)
  const [formData, setFormData] = useState<JobPostingFormData>({
    title: "",
    category_id: "",
    description: "",
    working_type: "Plats",
    has_flexible_duration: true,
    start_date: "",
    end_date: "",
    location_county_id: "",
    location_municipality_id: "",
    supervisor_id: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  // Filter municipalities based on selected county
  const filteredMunicipalities = municipalities.filter(
    m => formData.location_county_id ? m.county_id.toString() === formData.location_county_id : true
  )

  // Load job postings
  useEffect(() => {
    loadJobPostings()
  }, [companyId])

  const loadJobPostings = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("job_postings")
        .select(`
          *,
          education_categories(id, name),
          counties(id, name),
          municipalities(id, name),
          company_handledare(id, first_name, last_name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setJobPostings(data || [])

    } catch (error: any) {
      console.error("Error loading job postings:", error)
      toast.error("Failed to load job postings: " + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      category_id: "",
      description: "",
      working_type: "Plats",
      has_flexible_duration: true,
      start_date: "",
      end_date: "",
      location_county_id: "",
      location_municipality_id: "",
      supervisor_id: ""
    })
    setEditingJob(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (job: JobPosting) => {
    setEditingJob(job)
    setFormData({
      title: job.title,
      category_id: job.category_id.toString(),
      description: job.description || "",
      working_type: job.working_type,
      has_flexible_duration: job.has_flexible_duration,
      start_date: job.start_date || "",
      end_date: job.end_date || "",
      location_county_id: job.location_county_id?.toString() || "",
      location_municipality_id: job.location_municipality_id?.toString() || "",
      supervisor_id: job.supervisor_id || ""
    })
    setIsDialogOpen(true)
  }

  const handleSave = async (status: 'active' | 'draft' = 'draft') => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const jobData: any = {
        company_id: companyId,
        title: formData.title,
        category_id: parseInt(formData.category_id),
        description: formData.description,
        working_type: formData.working_type,
        has_flexible_duration: formData.has_flexible_duration,
        status
      }

      // Add dates only if not flexible duration
      if (!formData.has_flexible_duration) {
        jobData.start_date = formData.start_date
        jobData.end_date = formData.end_date
      }

      // Add location if selected
      if (formData.location_county_id) {
        jobData.location_county_id = parseInt(formData.location_county_id)
      }
      if (formData.location_municipality_id) {
        jobData.location_municipality_id = parseInt(formData.location_municipality_id)
      }

      // Add supervisor if selected
      if (formData.supervisor_id) {
        jobData.supervisor_id = formData.supervisor_id
      }

      let error
      if (editingJob) {
        ({ error } = await supabase
          .from("job_postings")
          .update(jobData)
          .eq("id", editingJob.id))
      } else {
        ({ error } = await supabase
          .from("job_postings")
          .insert([jobData]))
      }

      if (error) throw error

      toast.success(editingJob ? "Job posting updated successfully" : "Job posting created successfully")
      setIsDialogOpen(false)
      resetForm()
      loadJobPostings()
      
    } catch (error: any) {
      toast.error(error.message || "An error occurred while saving")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (jobId: string, newStatus: 'active' | 'archived') => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("job_postings")
        .update({ status: newStatus })
        .eq("id", jobId)

      if (error) throw error

      toast.success(`Job posting ${newStatus === 'active' ? 'activated' : 'archived'} successfully`)
      loadJobPostings()
      
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("job_postings")
        .delete()
        .eq("id", jobId)

      if (error) throw error

      toast.success("Job posting deleted successfully")
      loadJobPostings()
      
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWorkingTypeBadge = (type: string) => {
    const colors = {
      'Plats': 'bg-blue-500',
      'Distance': 'bg-purple-500',
      'Hybrid': 'bg-orange-500'
    }
    return <Badge className={colors[type as keyof typeof colors] || 'bg-gray-500'}>{type}</Badge>
  }

  // Filter job postings based on hideArchived setting
  const filteredJobPostings = hideArchived 
    ? jobPostings.filter(job => job.status !== 'archived')
    : jobPostings

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Job Postings</h2>
          <p className="text-sm text-muted-foreground">
            {jobPostings.length} job posting{jobPostings.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Job Posting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? "Edit Job Posting" : "Create New Job Posting"}
              </DialogTitle>
              <DialogDescription>
                Fill in the job posting details
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Basic Information</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter job title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_id">Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Job description and requirements"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="working_type">Working Type *</Label>
                    <Select
                      value={formData.working_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, working_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select working type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Plats">On-site (Plats)</SelectItem>
                        <SelectItem value="Distance">Remote (Distance)</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Duration */}
              <div className="space-y-4">
                <h3 className="font-medium">Duration</h3>
                
                <RadioGroup
                  value={formData.has_flexible_duration ? "flexible" : "strict"}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    has_flexible_duration: value === "flexible" 
                  }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label htmlFor="flexible">Flexible Duration</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="strict" id="strict" />
                    <Label htmlFor="strict">Strict Dates</Label>
                  </div>
                </RadioGroup>

                {!formData.has_flexible_duration && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-4">
                <h3 className="font-medium">Work Location</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="county">County (Län)</Label>
                    <Select
                      value={formData.location_county_id}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        location_county_id: value,
                        location_municipality_id: "" // Reset municipality when county changes
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {counties.map((county) => (
                          <SelectItem key={county.id} value={county.id.toString()}>
                            {county.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="municipality">Municipality (Kommun)</Label>
                    <Select
                      value={formData.location_municipality_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, location_municipality_id: value }))}
                      disabled={!formData.location_county_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.location_county_id ? "Select municipality" : "Select county first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredMunicipalities.map((municipality) => (
                          <SelectItem key={municipality.id} value={municipality.id.toString()}>
                            {municipality.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Supervisor */}
              <div className="space-y-4">
                <h3 className="font-medium">Supervisor</h3>
                
                {supervisors.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="supervisor_id">Select Supervisor</Label>
                    <Select
                      value={formData.supervisor_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supervisor_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {supervisors.map((supervisor) => (
                          <SelectItem key={supervisor.id} value={supervisor.id}>
                            {supervisor.first_name} {supervisor.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No supervisors added yet. 
                    <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/dashboard/company/settings")}>
                      Add supervisors in Settings.
                    </Button>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={isLoading || !formData.title || !formData.category_id}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSave('active')}
                  disabled={isLoading || !formData.title || !formData.category_id}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {editingJob ? 'Update & Publish' : 'Create & Publish'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Options */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hide-archived"
          checked={hideArchived}
          onCheckedChange={(checked) => setHideArchived(checked as boolean)}
        />
        <Label htmlFor="hide-archived" className="text-sm">
          Hide archived postings
        </Label>
      </div>

      {/* Job Postings List */}
      <div className="grid gap-4">
        {filteredJobPostings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No job postings yet
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create your first LIA job posting to start attracting students.
              </p>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Job Posting
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobPostings.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      {getStatusBadge(job.status)}
                      {getWorkingTypeBadge(job.working_type)}
                    </div>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      {job.education_categories && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {job.education_categories.name}
                        </span>
                      )}
                      {job.counties && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.counties.name}{job.municipalities && `, ${job.municipalities.name}`}
                        </span>
                      )}
                      {job.company_handledare && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {job.company_handledare.first_name} {job.company_handledare.last_name}
                        </span>
                      )}
                      {!job.has_flexible_duration && job.start_date && job.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.start_date).toLocaleDateString()} - {new Date(job.end_date).toLocaleDateString()}
                        </span>
                      )}
                      {job.has_flexible_duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Flexible Duration
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(job)}
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    {job.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'archived')}
                        className="gap-1"
                      >
                        <Archive className="h-3 w-3" />
                        Archive
                      </Button>
                    )}
                    {job.status === 'archived' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'active')}
                        className="gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {job.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {job.description.length > 150 
                      ? `${job.description.substring(0, 150)}...` 
                      : job.description
                    }
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Applications: {job.application_count} • Created: {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 