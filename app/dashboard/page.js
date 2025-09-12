import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile to determine role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Redirect based on role
  switch (profile.role) {
    case "admin":
      redirect("/admin")
    case "faculty":
      redirect("/faculty")
    case "student":
      redirect("/student")
    default:
      redirect("/auth/login")
  }
}
