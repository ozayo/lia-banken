"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface County {
  id: number
  name: string
  code: string
}

interface Municipality {
  id: number
  name: string
  code: string
  county_id: number
}

interface School {
  id: string
  name: string
  logo_url?: string
  description?: string
  website_url?: string
  contact_email?: string
  contact_phone?: string
  organization_number?: string
  address_street?: string
  address_postal_code?: string
  address_county_id?: number
  address_municipality_id?: number
  address_county?: County
  address_municipality?: Municipality
}

interface SchoolProfileFormProps {
  school: School
  counties: County[]
  municipalities: Municipality[]
}

export function SchoolProfileForm({ school, counties, municipalities }: SchoolProfileFormProps) {
  const [name, setName] = useState(school.name || "")
  const [description, setDescription] = useState(school.description || "")
  const [websiteUrl, setWebsiteUrl] = useState(school.website_url || "")
  const [contactEmail, setContactEmail] = useState(school.contact_email || "")
  const [contactPhone, setContactPhone] = useState(school.contact_phone || "")
  const [organizationNumber, setOrganizationNumber] = useState(school.organization_number || "")
  const [addressStreet, setAddressStreet] = useState(school.address_street || "")
  const [addressPostalCode, setAddressPostalCode] = useState(school.address_postal_code || "")
  const [selectedCountyId, setSelectedCountyId] = useState<string>(school.address_county_id?.toString() || "")
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string>(school.address_municipality_id?.toString() || "")
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  // Filter municipalities based on selected county
  const filteredMunicipalities = municipalities.filter(
    m => selectedCountyId ? m.county_id.toString() === selectedCountyId : true
  )

  // Reset municipality when county changes
  useEffect(() => {
    if (selectedCountyId && school.address_municipality?.county_id && 
        school.address_municipality.county_id.toString() !== selectedCountyId) {
      setSelectedMunicipalityId("")
    }
  }, [selectedCountyId, school.address_municipality?.county_id])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const updateData: any = {
        name,
        description,
        website_url: websiteUrl,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        organization_number: organizationNumber,
        address_street: addressStreet,
        address_postal_code: addressPostalCode,
      }

      // Add county/municipality if selected
      if (selectedCountyId) {
        updateData.address_county_id = parseInt(selectedCountyId)
      }
      if (selectedMunicipalityId) {
        updateData.address_municipality_id = parseInt(selectedMunicipalityId)
      }

      const { error } = await supabase
        .from("schools")
        .update(updateData)
        .eq("id", school.id)

      if (error) throw error

      toast.success("School profile updated successfully")
      
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("File size must be less than 2MB")
      return
    }

    try {
      const supabase = createClient()
      
      // Get current user for auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User session not found")
      
      // Upload file to user's folder (to avoid RLS issues)
      const fileExt = file.name.split('.').pop()
      const fileName = `school-logo-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update school logo
      const { error: updateError } = await supabase
        .from("schools")
        .update({ logo_url: data.publicUrl })
        .eq("id", school.id)

      if (updateError) throw updateError

      toast.success("School logo updated successfully")
      
      router.refresh()
    } catch (error: any) {
      console.error("Logo upload error:", error)
      toast.error(error.message || "An error occurred while uploading logo")
    }
  }

  return (
    <form onSubmit={handleProfileUpdate} className="grid gap-6">
      {/* School Logo */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={school.logo_url} alt={school.name} />
          <AvatarFallback className="text-lg">
            {school.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="logo" className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>Change Logo</span>
            </Button>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            JPG, PNG or GIF. Maximum 2MB.
          </p>
        </div>
      </div>

      <Separator />

      {/* Basic Information */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">School Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter school name"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">About School</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a brief description about your school..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://school.se"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-number">Organization Number</Label>
            <Input
              id="org-number"
              value={organizationNumber}
              onChange={(e) => setOrganizationNumber(e.target.value)}
              placeholder="123456-7890"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="grid gap-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@school.se"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-phone">Phone Number</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+46 8 123 456 78"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div className="grid gap-4">
        <h3 className="text-lg font-medium">Address Information</h3>
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="address-street">Street Address</Label>
            <Input
              id="address-street"
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              placeholder="Arenavägen 61"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="postal-code">Postal Code</Label>
            <Input
              id="postal-code"
              value={addressPostalCode}
              onChange={(e) => setAddressPostalCode(e.target.value)}
              placeholder="121 77"
              maxLength={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="county">County (Län)</Label>
              <Select value={selectedCountyId} onValueChange={setSelectedCountyId}>
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
              <Label htmlFor="municipality">Municipality (Kommun)</Label>
              <Select 
                value={selectedMunicipalityId} 
                onValueChange={setSelectedMunicipalityId}
                disabled={!selectedCountyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCountyId ? "Select municipality" : "Select county first"} />
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
      </div>

      <Button type="submit" disabled={isLoading} className="w-fit">
        {isLoading ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  )
} 