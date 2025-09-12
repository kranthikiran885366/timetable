import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const body = await request.json()

    const { name, capacity, type, equipment, building, floor, description } = body

    if (!name || !capacity || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: room, error } = await supabase
      .from("rooms")
      .update({
        name,
        capacity,
        type,
        equipment: equipment || [],
        building,
        floor,
        description,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Error updating room:", error)
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params

    const { error } = await supabase.from("rooms").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Room deleted successfully" })
  } catch (error) {
    console.error("Error deleting room:", error)
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 })
  }
}
