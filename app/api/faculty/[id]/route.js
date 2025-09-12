import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    const { full_name, department, employee_id, specialization, max_hours_per_week, phone, office_location } = body

    if (!full_name || !department || !employee_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({ full_name, department })
      .eq("id", id)
      .select()
      .single()

    if (profileError) throw profileError

    // Update or create faculty record
    const { data: faculty, error: facultyError } = await supabase
      .from("faculty")
      .upsert(
        {
          id,
          employee_id,
          specialization,
          max_hours_per_week: max_hours_per_week || 20,
          phone,
          office_location,
        },
        { onConflict: "id" },
      )
      .select()
      .single()

    if (facultyError) throw facultyError

    return NextResponse.json({ faculty: { ...profile, ...faculty } })
  } catch (error) {
    console.error("Error updating faculty:", error)
    return NextResponse.json({ error: "Failed to update faculty" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Delete faculty record (profile will be cascade deleted)
    const { error: facultyError } = await supabase.from("faculty").delete().eq("id", id)

    if (facultyError) throw facultyError

    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) console.warn("Could not delete auth user:", authError)

    return NextResponse.json({ message: "Faculty deleted successfully" })
  } catch (error) {
    console.error("Error deleting faculty:", error)
    return NextResponse.json({ error: "Failed to delete faculty" }, { status: 500 })
  }
}
