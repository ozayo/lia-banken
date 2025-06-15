"use client";

import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { ClientAuthButton } from "@/components/client-auth-button";
import Image from "next/image";

export function Header() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">

          <Link href={"/"}><Image src="/lia-banken-logo.svg" alt="Logo" width={130} height={28} /></Link>
          <div className="flex items-center gap-4">
            <Link className="hover:underline" href={"/"}>Home</Link>
            <Link className="hover:underline" href={"/dashboard/school"}>School</Link>
            <Link className="hover:underline" href={"/dashboard/company"}>Company</Link>
            <Link className="hover:underline" href={"/dashboard/student"}>Student</Link>
          </div>
        </div>
        {!hasEnvVars ? <EnvVarWarning /> : <ClientAuthButton />}
      </div>
    </nav>
  );
} 