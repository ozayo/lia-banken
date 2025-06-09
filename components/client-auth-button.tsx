"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ClientAuthButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // İlk yüklemede kullanıcı bilgisini al
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    getUser();

    // Auth durumu değişimlerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  if (loading) {
    return <div className="h-8 w-20 bg-muted animate-pulse rounded-md"></div>;
  }

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}! 
      {/* Hello {user.user_metadata.first_name} {user.user_metadata.last_name}!
      Hello {user.user_metadata.display_name}! */}
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
} 