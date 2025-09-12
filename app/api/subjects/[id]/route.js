import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    const { name, code, department, credits } = body
    if (!name || !code || !department || !credits) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: subject, error } = await supabase
      .from("subjects")
      .update({ name, code, department, credits })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ subject })
  } catch (error) {
    console.error("Error updating subject:", error)
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { error } = await supabase.from("subjects").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error) {
    console.error("Error deleting subject:", error)
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 })
  }
}
