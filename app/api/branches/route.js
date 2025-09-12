import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: branches, error } = await supabase
      .from("branches")
      .select(`
        *,
        head_of_department:profiles(full_name),
        sections:sections(count),
        subjects:subjects(count)
      `)
      .order("name")

    if (error) throw error

    return NextResponse.json({ branches })
  } catch (error) {
    console.error("Error fetching branches:", error)
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { name, code, description, head_of_department, established_year, total_semesters } = body

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
    }

    const { data: branch, error } = await supabase
      .from("branches")
      .insert([
        {
          name,
          code: code.toUpperCase(),
          description,
          head_of_department: head_of_department || null,
          established_year,
          total_semesters,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ branch })
  } catch (error) {
    console.error("Error creating branch:", error)
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 })
  }
}
