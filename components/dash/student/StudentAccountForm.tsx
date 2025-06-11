"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface StudentAccountFormProps {
  user: User
  profile: {
    first_name: string | null
    last_name: string | null
    phone: string | null
    role: string
    school_id: string | null
    program_id: string | null
    schools?: { name: string } | null
    education_programs?: { name: string; education_code: string } | null
  }
}

export function StudentAccountForm({ user, profile }: StudentAccountFormProps) {
  const [firstName, setFirstName] = useState(profile.first_name || "")
  const [lastName, setLastName] = useState(profile.last_name || "")
  const [phone, setPhone] = useState(profile.phone || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  
  const router = useRouter()

  // Simple phone number cleanup (remove extra spaces, format consistently)
  const cleanPhoneNumber = (phoneStr: string) => {
    if (!phoneStr) return ""
    // Remove extra spaces and keep only numbers, +, -, and spaces
    return phoneStr.replace(/[^\d\+\-\s]/g, "").trim()
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: cleanPhoneNumber(phone),
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Update auth user display name only (phone stays in profiles table)
      const displayName = `${firstName} ${lastName}`.trim()
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          display_name: displayName,
          full_name: displayName // Some systems use full_name
        }
      })

      if (authError) throw authError

      toast.success("Profile updated successfully")
      
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    setIsPasswordLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success("Password updated successfully")
      
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("File size must be less than 2MB")
      return
    }

    try {
      const supabase = createClient()
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}` // Put in user's folder

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true // Allow overwriting
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update both auth user metadata and profiles table
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      })

      if (authError) throw authError

      // Update profiles table as well
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id)

      if (profileError) throw profileError

      toast.success("Avatar updated successfully")
      
      router.refresh()
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast.error(error.message)
    }
  }

  return (
    <div className="grid gap-6">
      {/* Profile Picture */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
          <AvatarFallback className="text-lg">
            {(firstName || "S").charAt(0)}{(lastName || "T").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label htmlFor="avatar" className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>Change Photo</span>
            </Button>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            JPG, PNG or GIF. Max size 2MB.
          </p>
        </div>
      </div>

      <Separator />

      {/* Personal Information Form */}
      <form onSubmit={handleProfileUpdate} className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            Email cannot be changed as it's linked to your school domain.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>

        {/* Education Information (Read-only) */}
        <Separator />
        <div className="grid gap-4">
          <h3 className="text-lg font-medium">Education Information</h3>
          <p className="text-sm text-muted-foreground">
            These details are managed by your school and cannot be modified here.
          </p>
          
          <div className="grid gap-2">
            <Label>School</Label>
            <Input
              value={profile.schools?.name || "Not specified"}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="grid gap-2">
            <Label>Education Program</Label>
            <Input
              value={
                profile.education_programs?.education_code && profile.education_programs?.name
                  ? `${profile.education_programs.education_code} - ${profile.education_programs.name}`
                  : profile.education_programs?.name || "Not specified"
              }
              disabled
              className="bg-muted"
            />
          </div>

        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </form>

      <Separator />

      {/* Password Change Form */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <Button type="submit" disabled={isPasswordLoading}>
              {isPasswordLoading ? "Updating..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 