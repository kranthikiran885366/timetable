import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = params

    const { name, code, description, head_of_department, established_year, total_semesters } = body

    const { data: branch, error } = await supabase
      .from("branches")
      .update({
        name,
        code: code.toUpperCase(),
        description,
        head_of_department: head_of_department || null,
        established_year,
        total_semesters,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ branch })
  } catch (error) {
    console.error("Error updating branch:", error)
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { error } = await supabase.from("branches").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting branch:", error)
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 })
  }
}
