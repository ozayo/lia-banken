"use client";

import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { ClientAuthButton } from "@/components/client-auth-button";
import { Logo } from "@/components/logo";

export function Header() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={"/"}><Logo /></Link>
          <div className="flex items-center gap-2">
            <Link href={"/"}>Home</Link>
            <Link href={"/dashboard/school"}>School</Link>
          </div>
        </div>
        {!hasEnvVars ? <EnvVarWarning /> : <ClientAuthButton />}
      </div>
    </nav>
  );
} 