"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Edit, BookOpen, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
}

interface Location {
  id: string
  name: string
}

interface EducationProgram {
  id: string
  name: string
  education_code?: string
  description?: string
  category_id?: number
  website_link?: string
  omfattning?: string
  studietakt?: string
  studieform?: string
  location_ids?: string[]
  duration_weeks?: number
  category?: Category
}

interface EducationProgramsManagerProps {
  schoolId: string
  programs: EducationProgram[]
  categories: Category[]
  locations: Location[]
}

interface ProgramFormData {
  id?: string
  name: string
  education_code: string
  description: string
  category_id: string
  website_link: string
  omfattning: string
  studietakt: string
  studieform: string
  location_ids: string[]
}

export function EducationProgramsManager({ 
  schoolId, 
  programs, 
  categories, 
  locations 
}: EducationProgramsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<EducationProgram | null>(null)
  const [formData, setFormData] = useState<ProgramFormData>({
    name: "",
    education_code: "",
    description: "",
    category_id: "",
    website_link: "",
    omfattning: "",
    studietakt: "",
    studieform: "",
    location_ids: []
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  const resetForm = () => {
    setFormData({
      name: "",
      education_code: "",
      description: "",
      category_id: "",
      website_link: "",
      omfattning: "",
      studietakt: "",
      studieform: "",
      location_ids: []
    })
    setEditingProgram(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (program: EducationProgram) => {
    setEditingProgram(program)
    setFormData({
      id: program.id,
      name: program.name,
      education_code: program.education_code || "",
      description: program.description || "",
      category_id: program.category_id?.toString() || "",
      website_link: program.website_link || "",
      omfattning: program.omfattning || "",
      studietakt: program.studietakt || "",
      studieform: program.studieform || "",
      location_ids: program.location_ids || []
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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Program adı gereklidir")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const saveData: any = {
        school_id: schoolId,
        name: formData.name.trim(),
        education_code: formData.education_code.trim() || null,
        description: formData.description.trim() || null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        website_link: formData.website_link.trim() || null,
        omfattning: formData.omfattning.trim() || null,
        studietakt: formData.studietakt || null,
        studieform: formData.studieform || null,
        location_ids: formData.location_ids.length > 0 ? formData.location_ids : null,
      }

      let error

      if (editingProgram) {
        // Update existing program
        const result = await supabase
          .from("education_programs")
          .update(saveData)
          .eq("id", editingProgram.id)
        error = result.error
      } else {
        // Create new program
        const result = await supabase
          .from("education_programs")
          .insert(saveData)
        error = result.error
      }

      if (error) throw error

      toast.success(editingProgram ? "Program güncellendi" : "Program eklendi")
      
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (programId: string) => {
    if (!confirm("Bu programı silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("education_programs")
        .delete()
        .eq("id", programId)

      if (error) throw error

      toast.success("Program silindi")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="grid gap-4">
      {/* Add Program Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {programs.length} program mevcut
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Eğitim Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProgram ? "Programı Düzenle" : "Yeni Eğitim Programı Ekle"}
              </DialogTitle>
              <DialogDescription>
                Eğitim programının detaylarını girin.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4">
              {/* Basic Info */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="program-name">Eğitim Adı*</Label>
                    <Input
                      id="program-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Frontend-utvecklare inom ramverk"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="program-code">Eğitim Kodu</Label>
                    <Input
                      id="program-code"
                      value={formData.education_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, education_code: e.target.value }))}
                      placeholder="FRMW02"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="program-category">Eğitim Kategorisi</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="program-description">Eğitim Açıklaması</Label>
                  <Textarea
                    id="program-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Bu programda öğrenciler..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="program-website">Eğitim Web Site Linki</Label>
                  <Input
                    id="program-website"
                    type="url"
                    value={formData.website_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_link: e.target.value }))}
                    placeholder="https://okul.se/frontend-utvecklare"
                  />
                </div>
              </div>

              <Separator />

              {/* Study Details */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="program-omfattning">Omfattning</Label>
                  <Input
                    id="program-omfattning"
                    value={formData.omfattning}
                    onChange={(e) => setFormData(prev => ({ ...prev, omfattning: e.target.value }))}
                    placeholder="400 YH-poäng (ca 2 år)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="program-studietakt">Studietakt</Label>
                    <Select 
                      value={formData.studietakt} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, studietakt: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Studietakt seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100%">100%</SelectItem>
                        <SelectItem value="75%">75%</SelectItem>
                        <SelectItem value="50%">50%</SelectItem>
                        <SelectItem value="25%">25%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="program-studieform">Studieform</Label>
                    <Select 
                      value={formData.studieform} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, studieform: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Studieform seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Plats">Plats</SelectItem>
                        <SelectItem value="Distance">Distance</SelectItem>
                        <SelectItem value="Flex">Flex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location Selection */}
              <div className="grid gap-4">
                <Label>Eğitim Lokasyonları</Label>
                <div className="grid gap-2 max-h-32 overflow-y-auto">
                  {locations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Henüz lokasyon eklenmemiş. Önce ayarlardan lokasyon ekleyin.
                    </p>
                  ) : (
                    locations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location.id}`}
                          checked={formData.location_ids.includes(location.id)}
                          onCheckedChange={(checked) => 
                            handleLocationChange(location.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`location-${location.id}`}>
                          {location.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  İptal
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Kaydediliyor..." : (editingProgram ? "Güncelle" : "Ekle")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Programs List */}
      <div className="grid gap-3">
        {programs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz eğitim programı eklenmemiş</p>
              <p className="text-sm text-muted-foreground">İlk programınızı eklemek için yukarıdaki butonu kullanın.</p>
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      {program.education_code && (
                        <Badge variant="secondary">{program.education_code}</Badge>
                      )}
                      {program.website_link && (
                        <a 
                          href={program.website_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {program.category && (
                      <p className="text-sm text-muted-foreground">{program.category.name}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(program)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(program.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  {program.description && (
                    <p className="text-muted-foreground">{program.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {program.omfattning && (
                      <span>📊 {program.omfattning}</span>
                    )}
                    {program.studietakt && (
                      <span>⏱️ {program.studietakt}</span>
                    )}
                    {program.studieform && (
                      <span>📍 {program.studieform}</span>
                    )}
                  </div>

                  {program.location_ids && program.location_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {program.location_ids.map(locationId => {
                        const location = locations.find(l => l.id === locationId)
                        return location ? (
                          <Badge key={locationId} variant="outline" className="text-xs">
                            {location.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 