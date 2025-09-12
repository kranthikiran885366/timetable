import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = params

    const { name, branch_id, year, semester, academic_year, max_students, class_teacher_id } = body

    const { data: section, error } = await supabase
      .from("sections")
      .update({
        name,
        branch_id,
        year,
        semester,
        academic_year,
        max_students,
        class_teacher_id: class_teacher_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ section })
  } catch (error) {
    console.error("Error updating section:", error)
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { error } = await supabase.from("sections").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting section:", error)
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 })
  }
}
