import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: subjects, error } = await supabase.from("subjects").select("*").order("name")

    if (error) throw error

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    const { name, code, department, credits } = body
    if (!name || !code || !department || !credits) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: subject, error } = await supabase
      .from("subjects")
      .insert([{ name, code, department, credits }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ subject }, { status: 201 })
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
  }
}
