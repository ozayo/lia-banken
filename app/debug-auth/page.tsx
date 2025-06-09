"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Get profile if user exists
      let profile = null
      let profileError = null
      if (user) {
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        profile = result.data
        profileError = result.error
      }

      setAuthState({
        session: session ? {
          access_token: session.access_token?.substring(0, 20) + "...",
          user: session.user?.email,
          expires_at: session.expires_at
        } : null,
        sessionError,
        user: user ? {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at
        } : null,
        userError,
        profile,
        profileError,
        cookies: document.cookie
      })
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(authState, null, 2)}
      </pre>
    </div>
  )
} 