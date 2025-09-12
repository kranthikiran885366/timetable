"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Clock,
  Settings,
  LogOut,
  BarChart3,
  UserCheck,
  Building,
  GraduationCap,
  Workflow,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Timetable Generator", href: "/admin/timetable", icon: Calendar },
  { name: "Course Wizard", href: "/admin/courses/wizard", icon: Workflow },
  { name: "Branches", href: "/admin/branches", icon: Building },
  { name: "Sections", href: "/admin/sections", icon: GraduationCap },
  { name: "Subjects", href: "/admin/subjects", icon: BookOpen },
  { name: "Faculty", href: "/admin/faculty", icon: UserCheck },
  { name: "Rooms", href: "/admin/rooms", icon: MapPin },
  { name: "Time Slots", href: "/admin/time-slots", icon: Clock },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

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
