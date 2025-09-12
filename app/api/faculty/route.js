import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: faculty, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "faculty")
      .order("full_name")

    if (error) throw error

    return NextResponse.json({ faculty })
  } catch (error) {
    console.error("Error fetching faculty:", error)
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { email, full_name, department, employee_id, specialization, max_hours_per_week } = body

    if (!email || !full_name || !department || !employee_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create auth user first
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "TempPassword123!", // Temporary password
      email_confirm: true,
      user_metadata: {
        full_name,
        role: "faculty",
        department,
      },
    })

    if (authError) throw authError

    // Create faculty record
    const { data: facultyRecord, error: facultyError } = await supabase
      .from("faculty")
      .insert([
        {
          id: authUser.user.id,
          employee_id,
          specialization,
          max_hours_per_week: max_hours_per_week || 20,
        },
      ])
      .select()
      .single()

    if (facultyError) throw facultyError

    return NextResponse.json({ faculty: facultyRecord }, { status: 201 })
  } catch (error) {
    console.error("Error creating faculty:", error)
    return NextResponse.json({ error: "Failed to create faculty" }, { status: 500 })
  }
}
