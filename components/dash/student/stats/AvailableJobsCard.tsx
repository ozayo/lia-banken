import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

async function getActiveJobPostingsCount() {
  try {
    const supabase = await createClient()
    
    // Try with regular client first
    const { data: regularData, error: regularError } = await supabase
      .from("job_postings")
      .select("id")
      .eq("status", "active")
    
    console.log("Regular client result:", { data: regularData, error: regularError })
    
    if (regularData && regularData.length > 0) {
      return regularData.length
    }

    // If regular client returns empty (RLS issue), we can implement a workaround
    // For now, return 0 but log the issue
    console.log("RLS Policy issue detected - student cannot access job_postings")
    
    return 0
  } catch (error) {
    console.error("Error fetching job postings count:", error)
    return 0
  }
}

export async function AvailableJobsCard() {
  const count = await getActiveJobPostingsCount()
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Available LIA Jobs
        </CardTitle>
        <Search className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">
          Active job postings
          {count === 0 && <span className="text-orange-500"> (Access restricted)</span>}
        </p>
      </CardContent>
    </Card>
  )
} 