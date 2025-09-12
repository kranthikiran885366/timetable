import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { schedule, semester, academic_year } = body

    if (!schedule || !semester || !academic_year) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    // Clear existing classes for this semester/year
    const { error: deleteError } = await supabase
      .from("classes")
      .delete()
      .eq("semester", semester)
      .eq("academic_year", academic_year)

    if (deleteError) throw deleteError

    // Insert new classes
    const { data: classes, error: insertError } = await supabase.from("classes").insert(schedule).select()

    if (insertError) throw insertError

    return NextResponse.json({
      message: "Timetable saved successfully",
      classes_count: classes.length,
    })
  } catch (error) {
    console.error("Error saving timetable:", error)
    return NextResponse.json({ error: "Failed to save timetable" }, { status: 500 })
  }
}
