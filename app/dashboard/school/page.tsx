import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SchoolSidebar } from "@/components/dash/school/SchoolSidebar"
import { SchoolHeader } from "@/components/dash/school/SchoolHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function SchoolDashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has school role and get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id, first_name, last_name, phone")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  if (profile.role !== "school") {
    redirect("/") // Redirect to home if not a school user
  }

  if (!profile.school_id) {
    // If school admin doesn't have a school yet, something went wrong
    redirect("/auth/login")
  }

  // Prepare user data for sidebar
  const sidebarUser = {
    name: `${profile.first_name || 'Okul'} ${profile.last_name || 'Admin'}`,
    email: user.email!, // We know email exists since user is authenticated
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <SidebarProvider>
      <SchoolSidebar user={sidebarUser} variant="inset" />
      <SidebarInset>
        <SchoolHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Welcome Section */}
              <div className="grid gap-4 px-4 lg:px-6">
                <h1 className="text-3xl font-bold tracking-tight">Okul Dashboard</h1>
                <p className="text-muted-foreground">
                  Okulunuzu yönetin, programları düzenleyin ve öğrenci durumlarını takip edin.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid auto-rows-min gap-4 md:grid-cols-4 px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Toplam Öğrenci
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">
                      +20.1% geçen aydan
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Programlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">
                      +2 yeni program
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      LIA Yerleştirmeleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">892</div>
                    <p className="text-xs text-muted-foreground">
                      %89 başarı oranı
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Dönemler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
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
                      Okulunuzdaki güncel gelişmeler
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Yeni öğrenci kaydı</p>
                        <p className="text-xs text-muted-foreground">
                          Ali Veli - Frontend Development programına kayıt oldu
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">LIA eşleşmesi</p>
                        <p className="text-xs text-muted-foreground">
                          Ayşe Özkan - TechCorp şirketinde LIA başladı
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Program güncellendi</p>
                        <p className="text-xs text-muted-foreground">
                          Backend Development programı müfredatı güncellendi
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
                      <div className="font-medium">Yeni Program Oluştur</div>
                      <div className="text-xs text-muted-foreground">
                        Okulunuza yeni eğitim programı ekleyin
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Dönem Ekle</div>
                      <div className="text-xs text-muted-foreground">
                        Mevcut programlara yeni dönem ekleyin
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="font-medium">Öğrenci Listesi</div>
                      <div className="text-xs text-muted-foreground">
                        Kayıtlı öğrencileri görüntüleyin
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