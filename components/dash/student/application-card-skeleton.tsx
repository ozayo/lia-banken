import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ApplicationCardSkeleton() {
  return (
    <Card>
      <div className="flex p-6 gap-6">
        {/* Company Logo Skeleton */}
        <div className="flex-shrink-0">
          <Skeleton className="w-16 h-16 rounded-md" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-grow">
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>

          {/* Application Info Skeleton */}
          <div className="flex flex-wrap gap-4 mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Description Skeleton */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Actions Skeleton */}
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </Card>
  )
} 