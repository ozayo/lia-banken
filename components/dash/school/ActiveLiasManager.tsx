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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Edit, 
  Archive, 
  Trash2, 
  Play, 
  Save, 
  Users, 
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import type { 
  Lia, 
  LiaFormData, 
  EducationProgram, 
  EducationCategory, 
  SchoolLocation 
} from "@/types/database"

interface ActiveLiasManagerProps {
  schoolId: string
  educationPrograms: (EducationProgram & { education_categories: EducationCategory })[]
  schoolLocations: SchoolLocation[]
  initialEnrollmentCounts?: Record<string, number>
}

interface LiaWithProgram extends Lia {
  education_programs: EducationProgram & {
    education_categories: EducationCategory
  }
  enrolled_students_count?: number // Number of students actually enrolled in this LIA
}

export function ActiveLiasManager({ 
  schoolId, 
  educationPrograms, 
  schoolLocations,
  initialEnrollmentCounts = {}
}: ActiveLiasManagerProps) {
  const [lias, setLias] = useState<LiaWithProgram[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLia, setEditingLia] = useState<Lia | null>(null)
  const [formData, setFormData] = useState<LiaFormData>({
    education_program_id: "",
    education_term: "",
    lia_code: "",
    lia_start_date: "",
    lia_end_date: "",
    short_description: "",
    student_count: 0,
    location_ids: [],
    teacher_name: "",
    teacher_email: "",
    teacher_phone: "",
    info_link: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [tableExists, setTableExists] = useState(false)
  
  const router = useRouter()

  // Check if table exists and load LIAs
  useEffect(() => {
    checkTableAndLoadLias()
  }, [schoolId])

  const checkTableAndLoadLias = async () => {
    try {
      const supabase = createClient()
      
      // First get LIAs with their program info
      const { data: liasData, error: liasError } = await supabase
        .from("lias")
        .select(`
          *,
          education_programs!inner(
            *,
            education_categories(*)
          )
        `)
        .eq("school_id", schoolId)
        .in("lia_status", ["inactive", "active"])
        .order("created_at", { ascending: false })

      if (liasError) {
        if (liasError.message.includes("does not exist")) {
          setTableExists(false)
          console.warn("LIAs table does not exist yet")
          return
        } else {
          throw liasError
        }
      }

      if (!liasData) {
        setTableExists(true)
        setLias([])
        return
      }

      // Get enrolled student counts for each LIA
      const liaIds = liasData.map(lia => lia.id)
      
      // Use server-side enrollment counts if available, otherwise fetch client-side
      let enrollmentCounts = initialEnrollmentCounts
      
      if (Object.keys(enrollmentCounts).length === 0) {
        // Fallback to client-side fetching if server-side data not available
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from("profiles")
          .select("lia_id")
          .in("lia_id", liaIds)
          .eq("role", "student")

        if (enrollmentError) {
          console.warn("Could not fetch enrollment data from profiles:", enrollmentError)
        }

        // Count enrollments per LIA
        enrollmentCounts = enrollmentData?.reduce((acc, profile) => {
          if (profile.lia_id) {
            acc[profile.lia_id] = (acc[profile.lia_id] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>) || {}
      }

      // Combine LIA data with enrollment counts
      const liasWithEnrollments = liasData.map(lia => ({
        ...lia,
        enrolled_students_count: enrollmentCounts[lia.id] || 0
      }))

      setTableExists(true)
      setLias(liasWithEnrollments)

    } catch (error: any) {
      console.error("Error loading LIAs:", error)
      toast.error("Error loading LIAs: " + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      education_program_id: "",
      education_term: "",
      lia_code: "",
      lia_start_date: "",
      lia_end_date: "",
      short_description: "",
      student_count: 0,
      location_ids: [],
      teacher_name: "",
      teacher_email: "",
      teacher_phone: "",
      info_link: ""
    })
    setEditingLia(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (lia: Lia) => {
    setEditingLia(lia)
    setFormData({
      education_program_id: lia.education_program_id,
      education_term: lia.education_term,
      lia_code: lia.lia_code,
      lia_start_date: lia.lia_start_date,
      lia_end_date: lia.lia_end_date,
      short_description: lia.short_description || "",
      student_count: lia.student_count,
      location_ids: lia.location_ids,
      teacher_name: lia.teacher_name,
      teacher_email: lia.teacher_email,
      teacher_phone: lia.teacher_phone || "",
      info_link: lia.info_link || ""
    })
    setIsDialogOpen(true)
  }

  const handleLocationChange = (locationId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        location_ids: [...prev.location_ids, locationId]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        location_ids: prev.location_ids.filter(id => id !== locationId)
      }))
    }
  }

  const handleSave = async (status: 'inactive' | 'active' = 'inactive') => {
    if (!tableExists) {
      toast.error("LIA table has not been created yet. Please run the database migration.")
      return
    }

    if (!formData.education_program_id || !formData.education_term || !formData.lia_code || 
        !formData.lia_start_date || !formData.lia_end_date || !formData.teacher_name || 
        !formData.teacher_email) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const saveData = {
        school_id: schoolId,
        education_program_id: formData.education_program_id,
        education_term: formData.education_term.trim(),
        lia_code: formData.lia_code.trim(),
        lia_start_date: formData.lia_start_date,
        lia_end_date: formData.lia_end_date,
        short_description: formData.short_description?.trim() || null,
        student_count: formData.student_count,
        location_ids: formData.location_ids,
        teacher_name: formData.teacher_name.trim(),
        teacher_email: formData.teacher_email.trim(),
        teacher_phone: formData.teacher_phone?.trim() || null,
        info_link: formData.info_link?.trim() || null,
        lia_status: status
      }

      let error

      if (editingLia) {
        // Update existing LIA
        const result = await supabase
          .from("lias")
          .update(saveData)
          .eq("id", editingLia.id)
        error = result.error
      } else {
        // Create new LIA
        const result = await supabase
          .from("lias")
          .insert(saveData)
        error = result.error
      }

      if (error) throw error

      const actionText = status === 'active' ? 'published' : 'saved'
      toast.success(editingLia ? `LIA updated` : `LIA ${actionText}`)
      
      setIsDialogOpen(false)
      resetForm()
      checkTableAndLoadLias()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (liaId: string, newStatus: 'active' | 'archived') => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("lias")
        .update({ lia_status: newStatus })
        .eq("id", liaId)

      if (error) throw error

      const statusText = newStatus === 'active' ? 'activated' : 'archived'
      toast.success(`LIA ${statusText}`)
      checkTableAndLoadLias()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (liaId: string) => {
    if (!confirm("Are you sure you want to delete this LIA?")) {
      return
    }

    try {
      const supabase = createClient()
      
      // TODO: Check if any students are enrolled in this LIA
      // This would require a students table with lia_id references
      
      const { error } = await supabase
        .from("lias")
        .delete()
        .eq("id", liaId)

      if (error) throw error

      toast.success("LIA deleted")
      checkTableAndLoadLias()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getLiaTitle = (lia: LiaWithProgram) => {
    return `${lia.lia_code} - ${lia.education_programs.name}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLocationNames = (locationIds: string[]) => {
    return locationIds
      .map(id => schoolLocations.find(loc => loc.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  // If table doesn't exist, show setup message
  if (!tableExists) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              LIA System Setup Required
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Database table for LIA management system needs to be created.
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>database/migrations/create_lias_table.sql</strong> file's SQL needs to be 
                executed in Supabase dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Active LIA Programs</h2>
          <p className="text-sm text-muted-foreground">
            {lias.length} LIA programs found
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add LIA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLia ? "Edit LIA" : "Add New LIA"}
              </DialogTitle>
              <DialogDescription>
                Fill in the LIA program information
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education_program_id">Education Program *</Label>
                    <Select
                      value={formData.education_program_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, education_program_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationPrograms.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.education_code ? `${program.education_code} - ${program.name}` : program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education_term">Education Term *</Label>
                    <Input
                      id="education_term"
                      value={formData.education_term}
                      onChange={(e) => setFormData(prev => ({ ...prev, education_term: e.target.value }))}
                      placeholder="e.g: 2023-2024, Spring 2025-Fall 2026"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lia_code">LIA Code *</Label>
                    <Input
                      id="lia_code"
                      value={formData.lia_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, lia_code: e.target.value }))}
                      placeholder="e.g: LIA-001, A, V1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lia_start_date">Start Date *</Label>
                    <Input
                      id="lia_start_date"
                      type="date"
                      value={formData.lia_start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, lia_start_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lia_end_date">End Date *</Label>
                    <Input
                      id="lia_end_date"
                      type="date"
                      value={formData.lia_end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, lia_end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_count">Student Count</Label>
                    <Input
                      id="student_count"
                      type="number"
                      min="0"
                      value={formData.student_count}
                      onChange={(e) => setFormData(prev => ({ ...prev, student_count: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="info_link">Information Link</Label>
                    <Input
                      id="info_link"
                      type="url"
                      value={formData.info_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, info_link: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Short Description</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="Brief information about the LIA"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Location Selection */}
              <div className="space-y-4">
                <h3 className="font-medium">Locations</h3>
                {schoolLocations.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {schoolLocations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={location.id}
                          checked={formData.location_ids.includes(location.id)}
                          onCheckedChange={(checked) => handleLocationChange(location.id, checked as boolean)}
                        />
                        <Label htmlFor={location.id} className="text-sm">
                          {location.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No school locations added yet. 
                    <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/dashboard/school/settings")}>
                      You can add them from settings page.
                    </Button>
                  </p>
                )}
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Contact Information</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacher_name">LIA Coordinator Name *</Label>
                    <Input
                      id="teacher_name"
                      value={formData.teacher_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, teacher_name: e.target.value }))}
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher_email">Email *</Label>
                      <Input
                        id="teacher_email"
                        type="email"
                        value={formData.teacher_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, teacher_email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher_phone">Phone</Label>
                      <Input
                        id="teacher_phone"
                        type="tel"
                        value={formData.teacher_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, teacher_phone: e.target.value }))}
                        placeholder="+46 XX XXX XXXX"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSave('inactive')}
                disabled={isLoading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button 
                onClick={() => handleSave('active')}
                disabled={isLoading}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Publish
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* LIA Cards */}
      <div className="grid gap-4">
        {lias.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No LIA programs yet
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Click "Add LIA" button to create your first LIA program.
              </p>
            </CardContent>
          </Card>
        ) : (
          lias.map((lia) => (
            <Card key={lia.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getLiaTitle(lia)}
                      {getStatusBadge(lia.lia_status)}
                    </CardTitle>
                    <CardDescription>
                      {lia.education_programs.education_code} | {lia.education_term} | {lia.education_programs.education_categories.name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(lia)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {lia.lia_status === 'inactive' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleStatusChange(lia.id, 'active')}
                        title="Publish"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {lia.lia_status === 'active' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleStatusChange(lia.id, 'archived')}
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(lia.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(lia.lia_start_date).toLocaleDateString('en')} - {new Date(lia.lia_end_date).toLocaleDateString('en')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {lia.enrolled_students_count || 0}/{lia.student_count} students
                      {lia.student_count > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({(((lia.enrolled_students_count || 0) / lia.student_count) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                {lia.short_description && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {lia.short_description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{lia.teacher_name}</span>
                  </div>                  
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{lia.teacher_email}</span>
                  </div>
                  {lia.teacher_phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{lia.teacher_phone}</span>
                    </div>
                  )}
                  {lia.info_link && (
                    <a 
                      href={lia.info_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Details</span>
                    </a>
                  )}
                </div>
                {/* Locations */}
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {lia.location_ids.length > 0 ? (
                      lia.location_ids.map(locationId => {
                        const location = schoolLocations.find(loc => loc.id === locationId)
                        return location ? (
                          <Badge key={locationId} variant="outline" className="text-xs">
                            {location.name}
                          </Badge>
                        ) : null
                      })
                    ) : (
                      <Badge variant="outline">No location specified</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 