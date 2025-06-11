"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Edit, Trash2 } from "lucide-react"

interface Handledare {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}

interface CompanyHandledareManagerProps {
  companyId: string
  handledare: Handledare[]
}

export function CompanyHandledareManager({ companyId, handledare }: CompanyHandledareManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHandledare, setEditingHandledare] = useState<Handledare | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  const openDialog = (handledareToEdit?: Handledare) => {
    if (handledareToEdit) {
      setEditingHandledare(handledareToEdit)
      setFirstName(handledareToEdit.first_name)
      setLastName(handledareToEdit.last_name)
      setEmail(handledareToEdit.email)
      setPhone(handledareToEdit.phone || "")
    } else {
      setEditingHandledare(null)
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingHandledare(null)
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const handledareData = {
        company_id: companyId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      }

      if (editingHandledare) {
        // Update existing handledare
        const { error } = await supabase
          .from("company_handledare")
          .update({
            ...handledareData,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingHandledare.id)

        if (error) throw error
        toast.success("Handledare updated successfully")
      } else {
        // Create new handledare
        const { error } = await supabase
          .from("company_handledare")
          .insert(handledareData)

        if (error) throw error
        toast.success("Handledare added successfully")
      }

      closeDialog()
      router.refresh()
    } catch (error: any) {
      console.error("Error saving handledare:", error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (handledareId: string) => {
    if (!confirm("Are you sure you want to delete this handledare?")) {
      return
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("company_handledare")
        .delete()
        .eq("id", handledareId)

      if (error) throw error

      toast.success("Handledare deleted successfully")
      router.refresh()
    } catch (error: any) {
      console.error("Error deleting handledare:", error)
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Handledare List</h3>
          <p className="text-sm text-muted-foreground">
            Manage your LIA supervisors and their contact information.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Handledare
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingHandledare ? "Edit Handledare" : "Add New Handledare"}
              </DialogTitle>
              <DialogDescription>
                {editingHandledare 
                  ? "Update the handledare information below."
                  : "Add a new LIA supervisor to your company."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number (optional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading 
                    ? "Saving..." 
                    : editingHandledare 
                    ? "Update Handledare" 
                    : "Add Handledare"
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {handledare.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No handledare added yet. Click "Add Handledare" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {handledare.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      {person.first_name} {person.last_name}
                    </TableCell>
                    <TableCell>{person.email}</TableCell>
                    <TableCell>{person.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(person)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(person.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 