import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CompanySidebar } from "@/components/dash/company/CompanySidebar"
import { CompanyHeader } from "@/components/dash/company/CompanyHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function CompanyDashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has company role and get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id, first_name, last_name, phone")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  if (profile.role !== "company") {
    redirect("/") // Redirect to home if not a company user
  }

  if (!profile.company_id) {
    // If company admin doesn't have a company yet, something went wrong
    redirect("/auth/login")
  }

  // Get company information
  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .single()

  if (!company) {
    redirect("/auth/login")
  }

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'Şirket'} ${profile.last_name || 'Admin'}`,
    email: user.email!, // We know email exists since user is authenticated
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <CompanySidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <CompanyHeader user={user} profile={profile} company={company} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Welcome Section */}
              <div className="grid gap-4 px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">Şirket Dashboard</h1>
                <p className="text-muted-foreground">
                  Şirketinizi yönetin, LIA ilanları oluşturun ve öğrenci başvurularını değerlendirin.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid auto-rows-min gap-4 md:grid-cols-4 px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif LIA İlanları
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">
                      +4 bu aydan
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Bekleyen Başvurular
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">142</div>
                    <p className="text-xs text-muted-foreground">
                      +22 bu hafta
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif LIA Öğrencileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18</div>
                    <p className="text-xs text-muted-foreground">
                      3 farklı pozisyonda
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tamamlanan LIA'lar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">156</div>
                    <p className="text-xs text-muted-foreground">
                      Bu akademik yıl
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid gap-4 md:grid-cols-2 px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Son Aktiviteler</CardTitle>
                    <CardDescription>
                      Şirketinizdeki güncel gelişmeler
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Yeni başvuru</p>
                        <p className="text-xs text-muted-foreground">
                          Mehmet Kaya - Frontend Developer pozisyonuna başvurdu
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">LIA başladı</p>
                        <p className="text-xs text-muted-foreground">
                          Ayşe Demir - Backend Developer olarak LIA'ya başladı
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">İlan güncellendi</p>
                        <p className="text-xs text-muted-foreground">
                          UX/UI Designer ilanı güncellendi
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hızlı İşlemler</CardTitle>
                    <CardDescription>
                      Sık kullanılan işlemler
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Yeni LIA İlanı Oluştur</div>
                      <div className="text-xs text-muted-foreground">
                        Yeni pozisyon için LIA ilanı yayınlayın
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Başvuruları İncele</div>
                      <div className="text-xs text-muted-foreground">
                        Bekleyen başvuruları değerlendirin
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Şirket Profili</div>
                      <div className="text-xs text-muted-foreground">
                        Şirket bilgilerinizi güncelleyin
                      </div>
                    </button>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 