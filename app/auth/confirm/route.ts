import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Kullanıcıyı tekrar al
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // profiles tablosundan role bilgisini çek
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        // Role'a göre yönlendir
        if (profile?.role === "student") {
          redirect("/dashboard/student");
        } else if (profile?.role === "school") {
          redirect("/dashboard/school");
        } else if (profile?.role === "company") {
          redirect("/dashboard/company");
        } else if (profile?.role === "admin") {
          redirect("/dashboard/admin");
        } else {
          redirect("/");
        }
      } else {
        redirect("/");
      }
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${error?.message}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
