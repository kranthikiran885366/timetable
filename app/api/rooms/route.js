import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: rooms, error } = await supabase.from("rooms").select("*").order("name")

    if (error) throw error

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { name, capacity, type, equipment } = body

    if (!name || !capacity || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: room, error } = await supabase
      .from("rooms")
      .insert([{ name, capacity, type, equipment: equipment || [] }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
