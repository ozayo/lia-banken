"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

interface SchoolDomainsFormProps {
  schoolId: string
  currentDomains: string[]
}

export function SchoolDomainsForm({ schoolId, currentDomains }: SchoolDomainsFormProps) {
  const [domains, setDomains] = useState<string[]>(currentDomains)
  const [newDomain, setNewDomain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()

  const addDomain = () => {
    if (!newDomain.trim()) {
      toast.error("Domain adı boş olamaz")
      return
    }

    // Simple domain validation
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/
    if (!domainPattern.test(newDomain.trim())) {
      toast.error("Geçerli bir domain formatı girin (örn: okul.se)")
      return
    }

    if (domains.includes(newDomain.trim())) {
      toast.error("Bu domain zaten listede mevcut")
      return
    }

    setDomains([...domains, newDomain.trim()])
    setNewDomain("")
  }

  const removeDomain = (domainToRemove: string) => {
    if (domains.length === 1) {
      toast.error("En az bir domain bulunmalıdır")
      return
    }
    setDomains(domains.filter(domain => domain !== domainToRemove))
  }

  const handleSave = async () => {
    if (domains.length === 0) {
      toast.error("En az bir domain eklemelisiniz")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("schools")
        .update({ allowed_domains: domains })
        .eq("id", schoolId)

      if (error) throw error

      toast.success("Domain listesi başarıyla güncellendi")
      
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Domain listesi güncellenirken bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addDomain()
    }
  }

  return (
    <div className="grid gap-4">
      {/* Current domains */}
      <div className="grid gap-3">
        <Label>Mevcut Domainler</Label>
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <Badge key={domain} variant="secondary" className="flex items-center gap-2">
              {domain}
              <button
                type="button"
                onClick={() => removeDomain(domain)}
                className="ml-1 hover:text-destructive"
                disabled={domains.length === 1}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {domains.length === 0 && (
            <p className="text-sm text-muted-foreground">Henüz domain eklenmemiş</p>
          )}
        </div>
      </div>

      {/* Add new domain */}
      <div className="grid gap-3">
        <Label htmlFor="new-domain">Yeni Domain Ekle</Label>
        <div className="flex gap-2">
          <Input
            id="new-domain"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="ornek.se"
            onKeyPress={handleKeyPress}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addDomain}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Öğrenciler sadece bu domainlerden e-posta adresi ile kayıt olabilir.
        </p>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading || domains.length === 0}
        >
          {isLoading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  )
} 