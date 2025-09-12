import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserSidebar } from "@/components/user-sidebar"

export default async function StudentLayout({ children }) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Check if user is student
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "student") {
    redirect("/auth/login")
  }

  return (
    <div className="flex h-screen bg-background">
      <UserSidebar userRole="student" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
