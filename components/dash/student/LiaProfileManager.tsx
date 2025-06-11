"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Download, Trash2, FileText, MapPin, Briefcase, FileCheck, LinkIcon, Plus, ExternalLink, Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiaProfileManagerProps {
  user: User
  profile: {
    first_name: string | null
    last_name: string | null
    phone: string | null
    role: string
    school_id: string | null
    program_id: string | null
    lia_id: string | null
  }
  schoolInfo: { name: string } | null
  programInfo: { name: string; education_code: string } | null
  liaInfo: { 
    education_term: string | null
    lia_code: string | null
    lia_start_date: string | null
    lia_end_date: string | null
  } | null
  liaPosting: any
  studentLinks: { id: string; link_name: string; url: string }[]
  counties: { id: number; name: string }[]
}

export function LiaProfileManager({ 
  user, 
  profile, 
  schoolInfo, 
  programInfo, 
  liaInfo,
  liaPosting, 
  studentLinks, 
  counties 
}: LiaProfileManagerProps) {
  const [positionTitle, setPositionTitle] = useState(liaPosting?.position_title || "")
  const [coverLetter, setCoverLetter] = useState(liaPosting?.cover_letter || "")
  const [workingType, setWorkingType] = useState(liaPosting?.working_type_preference || "any")
  const [selectedCounty, setSelectedCounty] = useState(liaPosting?.county_id?.toString() || "")
  const [selectedMunicipality, setSelectedMunicipality] = useState(liaPosting?.municipality_id?.toString() || "")
  const [streetAddress, setStreetAddress] = useState(liaPosting?.street_address || "")
  const [postalCode, setPostalCode] = useState(liaPosting?.postal_code || "")
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string }[]>([])
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [currentCvPath, setCurrentCvPath] = useState(liaPosting?.cv_file_path || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isDraftLoading, setIsDraftLoading] = useState(false)
  const [links, setLinks] = useState(studentLinks)
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [editingLink, setEditingLink] = useState<{ id: string; link_name: string; url: string } | null>(null)
  const [newLinkName, setNewLinkName] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  
  const router = useRouter()

  // Load municipalities when county changes
  useEffect(() => {
    if (selectedCounty) {
      loadMunicipalities(parseInt(selectedCounty))
    } else {
      setMunicipalities([])
      setSelectedMunicipality("")
    }
  }, [selectedCounty])

  const loadMunicipalities = async (countyId: number) => {
    try {
      const supabase = createClient()
      const { data: municipalityData } = await supabase
        .from("municipalities")
        .select("id, name")
        .eq("county_id", countyId)
        .order("name")
      
      setMunicipalities(municipalityData || [])
    } catch (error) {
      console.error("Error loading municipalities:", error)
    }
  }

  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    const fields = [
      positionTitle,
      coverLetter,
      workingType,
      selectedCounty,
      selectedMunicipality,
      streetAddress,
      postalCode,
      currentCvPath || cvFile
    ]
    const filledFields = fields.filter(field => field && field.toString().trim() !== "").length
    return Math.round((filledFields / fields.length) * 100)
  }

  const handleCvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed")
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File size must be less than 5MB")
      return
    }

    setCvFile(file)
    toast.success("CV file selected. Save to upload.")
  }

  const handleCvDelete = async () => {
    if (!currentCvPath) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('cvs')
        .remove([currentCvPath])

      if (deleteError) throw deleteError

      setCurrentCvPath("")
      setCvFile(null)
      toast.success("CV deleted successfully")
    } catch (error: any) {
      console.error("CV delete error:", error)
      toast.error(error.message)
    }
  }

  const uploadCvToStorage = async () => {
    if (!cvFile) return currentCvPath

    try {
      const supabase = createClient()
      
      // Delete old CV if exists
      if (currentCvPath) {
        await supabase.storage
          .from('cvs')
          .remove([currentCvPath])
      }

      // Upload new CV
      const fileExt = cvFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, cvFile, {
          upsert: true
        })

      if (uploadError) throw uploadError

      return filePath
    } catch (error: any) {
      console.error("CV upload error:", error)
      throw error
    }
  }

  const handleSave = async (publishStatus: 'draft' | 'published') => {
    const loadingState = publishStatus === 'draft' ? setIsDraftLoading : setIsLoading
    loadingState(true)

    try {
      const supabase = createClient()
      
      // Upload CV if a new file is selected
      let cvPath = currentCvPath
      if (cvFile) {
        cvPath = await uploadCvToStorage()
      }

      const liaData = {
        profile_id: user.id,
        position_title: positionTitle,
        cover_letter: coverLetter,
        cv_file_path: cvPath,
        working_type_preference: workingType,
        county_id: selectedCounty ? parseInt(selectedCounty) : null,
        municipality_id: selectedMunicipality ? parseInt(selectedMunicipality) : null,
        street_address: streetAddress,
        postal_code: postalCode,
        publish_status: publishStatus,
      }

      let result
      if (liaPosting) {
        // Update existing posting
        result = await supabase
          .from("lia_postings")
          .update(liaData)
          .eq("id", liaPosting.id)
      } else {
        // Create new posting
        result = await supabase
          .from("lia_postings")
          .insert([liaData])
      }

      if (result.error) throw result.error

      setCurrentCvPath(cvPath)
      setCvFile(null)
      
      const action = publishStatus === 'published' ? 'published' : 'saved as draft'
      toast.success(`LIA profile ${action} successfully`)
      
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      loadingState(false)
    }
  }

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkUrl.trim()) {
      toast.error("Please enter both link name and URL")
      return
    }

    // Basic URL validation
    try {
      new URL(newLinkUrl)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("student_links")
        .insert([{
          profile_id: user.id,
          link_name: newLinkName.trim(),
          url: newLinkUrl.trim()
        }])
        .select()
        .single()

      if (error) throw error

      setLinks([...links, data])
      setNewLinkName("")
      setNewLinkUrl("")
      setIsAddingLink(false)
      toast.success("Link added successfully")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEditLink = async () => {
    if (!editingLink || !newLinkName.trim() || !newLinkUrl.trim()) {
      toast.error("Please enter both link name and URL")
      return
    }

    // Basic URL validation
    try {
      new URL(newLinkUrl)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("student_links")
        .update({
          link_name: newLinkName.trim(),
          url: newLinkUrl.trim()
        })
        .eq("id", editingLink.id)

      if (error) throw error

      setLinks(links.map(link => 
        link.id === editingLink.id 
          ? { ...link, link_name: newLinkName.trim(), url: newLinkUrl.trim() }
          : link
      ))
      setEditingLink(null)
      setNewLinkName("")
      setNewLinkUrl("")
      toast.success("Link updated successfully")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("student_links")
        .delete()
        .eq("id", linkId)

      if (error) throw error

      setLinks(links.filter(link => link.id !== linkId))
      toast.success("Link deleted successfully")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const startEditLink = (link: { id: string; link_name: string; url: string }) => {
    setEditingLink(link)
    setNewLinkName(link.link_name)
    setNewLinkUrl(link.url)
    setIsAddingLink(false)
  }

  const cancelLinkOperation = () => {
    setIsAddingLink(false)
    setEditingLink(null)
    setNewLinkName("")
    setNewLinkUrl("")
  }

  const completionPercentage = calculateCompletionPercentage()
  const isPublished = liaPosting?.publish_status === 'published'

  return (
    <div className="grid gap-6">
      {/* Status and Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isPublished ? (
            <div className={cn(
              "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
              "border-transparent bg-green-600 text-white shadow hover:bg-green-700"
            )}>
              Published
            </div>
          ) : (
            <Badge variant="destructive">
              Draft
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {completionPercentage}% completed
          </span>
        </div>
        <div className="w-32 bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <Separator />

      {/* Student Information (Read-only) */}
      <div className="grid gap-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Student Information
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Name</Label>
            <p className="text-base">{`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Not specified'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Email</Label>
            <p className="text-base">{user.email}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
            <p className="text-base">{profile.phone || 'Not specified'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">School</Label>
            <p className="text-base">{schoolInfo?.name || 'Not specified'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Program</Label>
            <p className="text-base">
              {programInfo?.education_code && programInfo?.name
                ? `${programInfo.education_code} - ${programInfo.name}`
                : programInfo?.name || 'Not specified'
              }
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Program Term</Label>
            <p className="text-base">{liaInfo?.education_term || 'Not specified'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">LIA Code</Label>
            <p className="text-base">{liaInfo?.lia_code || 'Not specified'}</p>
          </div>
          {liaInfo?.lia_start_date && liaInfo?.lia_end_date && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">LIA Period</Label>
              <p className="text-base">
                {new Date(liaInfo.lia_start_date).toLocaleDateString('sv-SE')} - {new Date(liaInfo.lia_end_date).toLocaleDateString('sv-SE')}
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* LIA Profile Form */}
      <div className="grid gap-8">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          LIA Profile Details
        </h3>

        {/* Position Title */}
        <div className="grid gap-2">
          <h4 className="font-medium">Position Title *</h4>
          <Input
            id="positionTitle"
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
            placeholder="e.g., Frontend Developer, Marketing Intern, etc."
            required
          />
        </div>

        {/* Cover Letter */}
        <div className="grid gap-2">
          <h4 className="font-medium">Cover Letter *</h4>
          <Textarea
            id="coverLetter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Write a compelling cover letter that showcases your skills, experience, and motivation for the LIA position..."
            rows={6}
            required
          />
        </div>

        {/* CV Upload */}
        <div className="grid gap-2">
          <h4 className="font-medium">CV Document *</h4>
          <div className="flex items-center gap-4">
            {currentCvPath ? (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">CV uploaded</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const supabase = createClient()
                      const { data, error } = await supabase.storage
                        .from('cvs')
                        .download(currentCvPath)
                      
                      if (error) throw error
                      
                      // Create blob URL and open in new tab
                      const url = URL.createObjectURL(data)
                      window.open(url, '_blank')
                      
                      // Clean up the URL after a delay
                      setTimeout(() => URL.revokeObjectURL(url), 100)
                    } catch (error: any) {
                      console.error('CV download error:', error)
                      toast.error('Failed to view CV: ' + error.message)
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCvDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Label htmlFor="cvUpload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload CV
                    </span>
                  </Button>
                  <Input
                    id="cvUpload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleCvUpload}
                  />
                </Label>
                {cvFile && (
                  <span className="text-sm text-muted-foreground">
                    {cvFile.name} selected
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            PDF format only. Max size 5MB.
          </p>
        </div>

        {/* My Links */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              My Links
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingLink(true)}
              disabled={isAddingLink || editingLink !== null}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
          </div>

          {/* Add/Edit Link Form */}
          {(isAddingLink || editingLink) && (
            <Card>
              <CardContent className="pt-4">
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="linkName">Link Name</Label>
                      <Input
                        id="linkName"
                        value={newLinkName}
                        onChange={(e) => setNewLinkName(e.target.value)}
                        placeholder="e.g., LinkedIn, GitHub, Portfolio"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="linkUrl">URL</Label>
                      <Input
                        id="linkUrl"
                        type="url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={editingLink ? handleEditLink : handleAddLink}
                    >
                      {editingLink ? "Update" : "Add"} Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelLinkOperation}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Links List */}
          {links.length > 0 && (
            <div className="grid gap-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{link.link_name}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditLink(link)}
                      disabled={isAddingLink || editingLink !== null}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={isAddingLink || editingLink !== null}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {links.length === 0 && !isAddingLink && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No links added yet. Click "Add Link" to get started.
            </p>
          )}
        </div>

        {/* Working Type Preference */}
        <div className="grid gap-3">
          <h4 className="font-medium">Working Type Preference *</h4>
          <RadioGroup value={workingType} onValueChange={setWorkingType} className="flex flex-row gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="any" />
              <Label htmlFor="any">Any</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="on-site" id="on-site" />
              <Label htmlFor="on-site">On-site (Plats)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="remote" id="remote" />
              <Label htmlFor="remote">Remote (Distance)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hybrid" id="hybrid" />
              <Label htmlFor="hybrid">Hybrid</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Address */}
        <div className="grid gap-4">
          <h4 className="font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address *
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Enter street address"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Enter postal code"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="county">Län (County)</Label>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
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

            <div className="grid gap-2">
              <Label htmlFor="municipality">Kommun (Municipality)</Label>
              <Select 
                value={selectedMunicipality} 
                onValueChange={setSelectedMunicipality}
                disabled={!selectedCounty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select municipality" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality.id} value={municipality.id.toString()}>
                      {municipality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => handleSave('draft')}
          disabled={isDraftLoading || isLoading}
        >
          {isDraftLoading ? "Saving..." : "Save as Draft"}
        </Button>
        <Button 
          onClick={() => handleSave('published')}
          disabled={isLoading || isDraftLoading || completionPercentage < 100}
        >
          {isLoading ? "Publishing..." : isPublished ? "Update & Publish" : "Publish"}
        </Button>
      </div>
      
      {completionPercentage < 100 && (
        <p className="text-sm text-muted-foreground">
          Complete all fields to publish your profile.
        </p>
      )}
    </div>
  )
} 