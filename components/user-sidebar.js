"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Calendar, BookOpen, User, LogOut, Users } from "lucide-react"

export function UserSidebar({ userRole }) {
  const pathname = usePathname()
  const router = useRouter()

  const navigation =
    userRole === "faculty"
      ? [
          { name: "My Dashboard", href: "/faculty", icon: User },
          { name: "My Schedule", href: "/faculty/schedule", icon: Calendar },
          { name: "My Subjects", href: "/faculty/subjects", icon: BookOpen },
          { name: "Students", href: "/faculty/students", icon: Users },
        ]
      : [
          { name: "My Dashboard", href: "/student", icon: User },
          { name: "My Timetable", href: "/student/timetable", icon: Calendar },
          { name: "My Subjects", href: "/student/subjects", icon: BookOpen },
        ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <Calendar className="h-8 w-8 text-sidebar-primary" />
        <span className="text-xl font-bold text-sidebar-foreground">TimetableGen</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
