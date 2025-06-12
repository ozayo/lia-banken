

import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { Newhero } from "@/components/newhero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Header } from "@/components/str/Header";
import { Footer } from "@/components/str/Footer";
import Features from "@/components/Features";

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <Header />
      <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
        <Hero />
        {/* <div className="flex-1 flex flex-col gap-6 px-4">
          <h2 className="font-medium text-xl mb-4">Next steps</h2>
          {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
        </div> */}
        <Features />
      </div>
      <Footer />
    </div>
  );
}
