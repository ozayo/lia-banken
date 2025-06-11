import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileStatusCardProps {
  status: "Draft" | "Published"
  percentage: number
}

export function ProfileStatusCard({ status, percentage }: ProfileStatusCardProps) {
  const isDraft = status === "Draft"
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Profile Status
        </CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          {isDraft ? (
            <Badge variant="destructive">
              {status}
            </Badge>
          ) : (
            <div className={cn(
              "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
              "border-transparent bg-green-600 text-white shadow hover:bg-green-700"
            )}>
              {status}
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {percentage}% completed
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          {isDraft 
            ? "Complete your profile to start applying" 
            : "Your profile is live and visible to employers"
          }
        </p>
      </CardContent>
    </Card>
  )
} 