"use client"

import { Button } from "@/components/ui/button"

interface ArchivedLiasManagerProps {
  schoolId: string
}

export function ArchivedLiasManager({ schoolId }: ArchivedLiasManagerProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Arşivlenmiş LIA Programları</h2>
          <p className="text-sm text-muted-foreground">
            Tamamlanmış LIA programlarınızı görüntüleyin
          </p>
        </div>
      </div>
      
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Arşivlenmiş LIA sistemi yakında eklenecek...
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          School ID: {schoolId}
        </p>
      </div>
    </div>
  )
} 