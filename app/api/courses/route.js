import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get("section_id")

    let query = supabase
      .from("courses")
      .select(`
        *,
        subject:subjects(name, code, credits),
        section:sections(name, year, semester),
        faculty:faculty(id, profiles(full_name))
      `)
      .order("created_at", { ascending: false })

    if (sectionId) {
      query = query.eq("section_id", sectionId)
    }

    const { data: courses, error } = await query

    if (error) throw error

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { subject_id, section_id, faculty_id, semester, academic_year, course_type, hours_per_week } = body

    if (!subject_id || !section_id || !faculty_id || !semester || !academic_year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: course, error } = await supabase
      .from("courses")
      .insert([
        {
          subject_id,
          section_id,
          faculty_id,
          semester,
          academic_year,
          course_type: course_type || "theory",
          hours_per_week: hours_per_week || 3,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ course })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}
