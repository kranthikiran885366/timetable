import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: sections, error } = await supabase
      .from("sections")
      .select(`
        *,
        branch:branches(name, code),
        class_teacher:faculty(id, profiles(full_name)),
        courses:courses(count)
      `)
      .order("branch_id")
      .order("year")
      .order("semester")

    if (error) throw error

    return NextResponse.json({ sections })
  } catch (error) {
    console.error("Error fetching sections:", error)
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { name, branch_id, year, semester, academic_year, max_students, class_teacher_id } = body

    if (!name || !branch_id || !year || !semester || !academic_year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: section, error } = await supabase
      .from("sections")
      .insert([
        {
          name,
          branch_id,
          year,
          semester,
          academic_year,
          max_students: max_students || 60,
          class_teacher_id: class_teacher_id || null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ section })
  } catch (error) {
    console.error("Error creating section:", error)
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 })
  }
}
