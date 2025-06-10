"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Edit, MapPin } from "lucide-react"
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

interface SchoolLocation {
  id: string
  name: string
  address_street?: string
  address_postal_code?: string
  address_county_id?: number
  address_municipality_id?: number
  address_county?: County
  address_municipality?: Municipality
}

interface SchoolLocationsManagerProps {
  schoolId: string
  locations: SchoolLocation[]
  counties: County[]
  municipalities: Municipality[]
}

interface LocationFormData {
  id?: string
  name: string
  address_street: string
  address_postal_code: string
  address_county_id: string
  address_municipality_id: string
}

export function SchoolLocationsManager({ 
  schoolId, 
  locations, 
  counties, 
  municipalities 
}: SchoolLocationsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<SchoolLocation | null>(null)
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    address_street: "",
    address_postal_code: "",
    address_county_id: "",
    address_municipality_id: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  // Filter municipalities based on selected county
  const filteredMunicipalities = municipalities.filter(
    m => formData.address_county_id ? m.county_id.toString() === formData.address_county_id : true
  )

  // Reset municipality when county changes
  useEffect(() => {
    if (formData.address_county_id && editingLocation?.address_municipality?.county_id && 
        editingLocation.address_municipality.county_id.toString() !== formData.address_county_id) {
      setFormData(prev => ({ ...prev, address_municipality_id: "" }))
    }
  }, [formData.address_county_id, editingLocation?.address_municipality?.county_id])

  const resetForm = () => {
    setFormData({
      name: "",
      address_street: "",
      address_postal_code: "",
      address_county_id: "",
      address_municipality_id: ""
    })
    setEditingLocation(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (location: SchoolLocation) => {
    setEditingLocation(location)
    setFormData({
      id: location.id,
      name: location.name,
      address_street: location.address_street || "",
      address_postal_code: location.address_postal_code || "",
      address_county_id: location.address_county_id?.toString() || "",
      address_municipality_id: location.address_municipality_id?.toString() || ""
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Lokasyon adı gereklidir")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const saveData: any = {
        school_id: schoolId,
        name: formData.name.trim(),
        address_street: formData.address_street.trim() || null,
        address_postal_code: formData.address_postal_code.trim() || null,
        address_county_id: formData.address_county_id ? parseInt(formData.address_county_id) : null,
        address_municipality_id: formData.address_municipality_id ? parseInt(formData.address_municipality_id) : null,
      }

      let error

      if (editingLocation) {
        // Update existing location
        const result = await supabase
          .from("school_locations")
          .update(saveData)
          .eq("id", editingLocation.id)
        error = result.error
      } else {
        // Create new location
        const result = await supabase
          .from("school_locations")
          .insert(saveData)
        error = result.error
      }

      if (error) throw error

      toast.success(editingLocation ? "Lokasyon güncellendi" : "Lokasyon eklendi")
      
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    if (!confirm("Bu lokasyonu silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("school_locations")
        .delete()
        .eq("id", locationId)

      if (error) throw error

      toast.success("Lokasyon silindi")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="grid gap-4">
      {/* Add Location Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {locations.length} lokasyon mevcut
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Lokasyon Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Lokasyonu Düzenle" : "Yeni Lokasyon Ekle"}
              </DialogTitle>
              <DialogDescription>
                Okulunuzun yeni bir lokasyonunu ekleyin veya mevcut lokasyonu düzenleyin.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location-name">Lokasyon Adı</Label>
                <Input
                  id="location-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ana Kampüs, İkinci Şube, vb."
                  required
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="location-street">Sokak Adresi</Label>
                <Input
                  id="location-street"
                  value={formData.address_street}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                  placeholder="Arenavägen 61"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location-postal">Posta Kodu</Label>
                <Input
                  id="location-postal"
                  value={formData.address_postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_postal_code: e.target.value }))}
                  placeholder="121 77"
                  maxLength={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location-county">İl (Län)</Label>
                  <Select 
                    value={formData.address_county_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, address_county_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="İl seçin" />
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
                  <Label htmlFor="location-municipality">Belediye (Kommun)</Label>
                  <Select 
                    value={formData.address_municipality_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, address_municipality_id: value }))}
                    disabled={!formData.address_county_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.address_county_id ? "Belediye seçin" : "Önce il seçin"} />
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

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  İptal
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Kaydediliyor..." : (editingLocation ? "Güncelle" : "Ekle")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations List */}
      <div className="grid gap-3">
        {locations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz lokasyon eklenmemiş</p>
              <p className="text-sm text-muted-foreground">İlk lokasyonunuzu eklemek için yukarıdaki butonu kullanın.</p>
            </CardContent>
          </Card>
        ) : (
          locations.map((location) => (
            <Card key={location.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(location)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1 text-sm text-muted-foreground">
                  {location.address_street && (
                    <p>{location.address_street}</p>
                  )}
                  {location.address_postal_code && (
                    <p>{location.address_postal_code}</p>
                  )}
                  {location.address_municipality?.name && (
                    <p>
                      {location.address_municipality.name}
                      {location.address_county?.name && `, ${location.address_county.name}`}
                    </p>
                  )}
                  {!location.address_street && !location.address_postal_code && !location.address_municipality?.name && (
                    <p className="text-muted-foreground italic">Adres bilgisi girilmemiş</p>
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