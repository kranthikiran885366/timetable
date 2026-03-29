import { createClient } from "@/lib/supabase/server"
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get comprehensive statistics
    const [studentsRes, facultyRes, subjectsRes, roomsRes, classesRes, enrollmentsRes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "faculty"),
      supabase.from("subjects").select("*", { count: "exact", head: true }),
      supabase.from("rooms").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase.from("student_enrollments").select("*", { count: "exact", head: true }),
    ])

    // Get department-wise statistics
    const { data: departmentStats } = await supabase.from("subjects").select("department").order("department")

    const departments = [...new Set(departmentStats?.map((s) => s.department) || [])]

    // Get recent activity
    const { data: recentClasses } = await supabase
      .from("classes")
      .select(`
        *,
        subjects(name, code),
        faculty:profiles!classes_faculty_id_fkey(full_name),
        rooms(name)
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    const stats = {
      totals: {
        students: studentsRes.count || 0,
        faculty: facultyRes.count || 0,
        subjects: subjectsRes.count || 0,
        rooms: roomsRes.count || 0,
        classes: classesRes.count || 0,
        enrollments: enrollmentsRes.count || 0,
      },
      departments: departments.length,
      recent_classes: recentClasses || [],
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
