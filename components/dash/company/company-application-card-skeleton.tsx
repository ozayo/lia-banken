import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CompanyApplicationCardSkeleton() {
  return (
    <Card>
      <div className="flex p-6 gap-6">
        <div className="flex-shrink-0">
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-grow">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </Card>
  )
}
