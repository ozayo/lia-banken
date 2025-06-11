"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface CompanyGeneralSettingsFormProps {
  companyId: string
  educationCategories: Array<{ id: string; name: string }>
  schools: Array<{ id: string; name: string }>
  educationPrograms: Array<{ 
    id: string; 
    name: string; 
    school_id: string;
    schools: { name: string }
  }>
  currentCategories: string[]
  currentSchools: string[]
  currentEducationPrograms: string[]
}

export function CompanyGeneralSettingsForm({
  companyId,
  educationCategories,
  schools,
  educationPrograms,
  currentCategories,
  currentSchools,
  currentEducationPrograms
}: CompanyGeneralSettingsFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(currentCategories)
  const [selectedSchools, setSelectedSchools] = useState<string[]>(currentSchools)
  const [selectedEducationPrograms, setSelectedEducationPrograms] = useState<string[]>(currentEducationPrograms)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  // Filter education programs based on selected schools
  const filteredEducationPrograms = educationPrograms.filter(program => 
    selectedSchools.includes(program.school_id)
  )

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId])
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId))
    }
  }

  const handleSchoolToggle = (schoolId: string, checked: boolean) => {
    if (checked) {
      setSelectedSchools(prev => [...prev, schoolId])
    } else {
      setSelectedSchools(prev => prev.filter(id => id !== schoolId))
      // Also remove education programs from unselected school
      const programsToRemove = educationPrograms
        .filter(program => program.school_id === schoolId)
        .map(program => program.id)
      setSelectedEducationPrograms(prev => 
        prev.filter(id => !programsToRemove.includes(id))
      )
    }
  }

  const handleEducationProgramToggle = (programId: string, checked: boolean) => {
    if (checked) {
      setSelectedEducationPrograms(prev => [...prev, programId])
    } else {
      setSelectedEducationPrograms(prev => prev.filter(id => id !== programId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Delete existing relationships
      await Promise.all([
        supabase.from("company_categories").delete().eq("company_id", companyId),
        supabase.from("company_schools").delete().eq("company_id", companyId),
        supabase.from("company_education_programs").delete().eq("company_id", companyId)
      ])

      // Insert new relationships
      const insertPromises = []

      if (selectedCategories.length > 0) {
        insertPromises.push(
          supabase.from("company_categories").insert(
            selectedCategories.map(categoryId => ({
              company_id: companyId,
              category_id: categoryId
            }))
          )
        )
      }

      if (selectedSchools.length > 0) {
        insertPromises.push(
          supabase.from("company_schools").insert(
            selectedSchools.map(schoolId => ({
              company_id: companyId,
              school_id: schoolId
            }))
          )
        )
      }

      if (selectedEducationPrograms.length > 0) {
        insertPromises.push(
          supabase.from("company_education_programs").insert(
            selectedEducationPrograms.map(programId => ({
              company_id: companyId,
              education_program_id: programId
            }))
          )
        )
      }

      if (insertPromises.length > 0) {
        const results = await Promise.all(insertPromises)
        
        // Check for errors
        const errors = results.filter(result => result.error)
        if (errors.length > 0) {
          throw new Error(errors[0].error.message)
        }
      }

      toast.success("Settings updated successfully")
      router.refresh()
    } catch (error: any) {
      console.error("Error updating settings:", error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Categories */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Education Categories</Label>
          <p className="text-sm text-muted-foreground">
            Select which education categories you accept LIA applications from.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {educationCategories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => 
                  handleCategoryToggle(category.id, checked as boolean)
                }
              />
              <Label 
                htmlFor={`category-${category.id}`}
                className="text-sm font-normal"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Schools */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Schools</Label>
          <p className="text-sm text-muted-foreground">
            Select which schools you accept LIA applications from.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schools.map((school) => (
            <div key={school.id} className="flex items-center space-x-2">
              <Checkbox
                id={`school-${school.id}`}
                checked={selectedSchools.includes(school.id)}
                onCheckedChange={(checked) => 
                  handleSchoolToggle(school.id, checked as boolean)
                }
              />
              <Label 
                htmlFor={`school-${school.id}`}
                className="text-sm font-normal"
              >
                {school.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Education Programs */}
      {selectedSchools.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Education Programs</Label>
            <p className="text-sm text-muted-foreground">
              Select specific education programs from your chosen schools.
            </p>
          </div>
          <div className="space-y-4">
            {selectedSchools.map(schoolId => {
              const school = schools.find(s => s.id === schoolId)
              const schoolPrograms = filteredEducationPrograms.filter(p => p.school_id === schoolId)
              
              if (schoolPrograms.length === 0) return null

              return (
                <Card key={schoolId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{school?.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {schoolPrograms.map((program) => (
                        <div key={program.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`program-${program.id}`}
                            checked={selectedEducationPrograms.includes(program.id)}
                            onCheckedChange={(checked) => 
                              handleEducationProgramToggle(program.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`program-${program.id}`}
                            className="text-sm font-normal"
                          >
                            {program.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Settings"}
      </Button>
    </form>
  )
} 