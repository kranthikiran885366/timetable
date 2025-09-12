import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { action, classId, updates } = body

    switch (action) {
      case "update_class":
        return await updateClass(supabase, classId, updates)
      case "swap_classes":
        return await swapClasses(supabase, body.class1Id, body.class2Id)
      case "check_conflicts":
        return await checkConflicts(supabase, body.proposedChanges)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Real-time update error:", error)
    return NextResponse.json(
      {
        error: "Failed to process real-time update",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

async function updateClass(supabase, classId, updates) {
  // Validate the update won't cause conflicts
  const conflicts = await validateClassUpdate(supabase, classId, updates)

  if (conflicts.length > 0) {
    return NextResponse.json({
      success: false,
      conflicts,
      message: "Update would cause conflicts",
    })
  }

  // Perform the update
  const { data, error } = await supabase
    .from("classes")
    .update(updates)
    .eq("id", classId)
    .select(`
      *,
      subjects:subject_id (name, code),
      faculty:faculty_id (full_name),
      rooms:room_id (name),
      time_slots:time_slot_id (day_of_week, start_time, end_time)
    `)

  if (error) {
    throw error
  }

  return NextResponse.json({
    success: true,
    updatedClass: data[0],
    message: "Class updated successfully",
  })
}

async function swapClasses(supabase, class1Id, class2Id) {
  // Get both classes
  const { data: classes, error } = await supabase.from("classes").select("*").in("id", [class1Id, class2Id])

  if (error || classes.length !== 2) {
    throw new Error("Could not fetch classes for swapping")
  }

  const [class1, class2] = classes

  // Validate swap won't cause conflicts
  const conflicts = await validateClassSwap(supabase, class1, class2)

  if (conflicts.length > 0) {
    return NextResponse.json({
      success: false,
      conflicts,
      message: "Swap would cause conflicts",
    })
  }

  // Perform the swap
  const updates1 = {
    time_slot_id: class2.time_slot_id,
    room_id: class2.room_id,
  }

  const updates2 = {
    time_slot_id: class1.time_slot_id,
    room_id: class1.room_id,
  }

  const [result1, result2] = await Promise.all([
    supabase.from("classes").update(updates1).eq("id", class1Id),
    supabase.from("classes").update(updates2).eq("id", class2Id),
  ])

  if (result1.error || result2.error) {
    throw new Error("Failed to swap classes")
  }

  return NextResponse.json({
    success: true,
    message: "Classes swapped successfully",
  })
}

async function checkConflicts(supabase, proposedChanges) {
  const conflicts = []

  for (const change of proposedChanges) {
    const changeConflicts = await validateClassUpdate(supabase, change.classId, change.updates)
    conflicts.push(...changeConflicts)
  }

  return NextResponse.json({ conflicts })
}

async function validateClassUpdate(supabase, classId, updates) {
  const conflicts = []

  // Get the current class
  const { data: currentClass } = await supabase.from("classes").select("*").eq("id", classId).single()

  if (!currentClass) {
    conflicts.push({ type: "class_not_found", classId })
    return conflicts
  }

  // Create the proposed class state
  const proposedClass = { ...currentClass, ...updates }

  // Check faculty conflicts
  if (updates.faculty_id || updates.time_slot_id) {
    const { data: facultyConflicts } = await supabase
      .from("classes")
      .select("id, subjects:subject_id(name)")
      .eq("faculty_id", proposedClass.faculty_id)
      .eq("time_slot_id", proposedClass.time_slot_id)
      .eq("semester", proposedClass.semester)
      .eq("academic_year", proposedClass.academic_year)
      .neq("id", classId)

    if (facultyConflicts && facultyConflicts.length > 0) {
      conflicts.push({
        type: "faculty_conflict",
        facultyId: proposedClass.faculty_id,
        timeSlotId: proposedClass.time_slot_id,
        conflictingClasses: facultyConflicts,
      })
    }
  }

  // Check room conflicts
  if (updates.room_id || updates.time_slot_id) {
    const { data: roomConflicts } = await supabase
      .from("classes")
      .select("id, subjects:subject_id(name)")
      .eq("room_id", proposedClass.room_id)
      .eq("time_slot_id", proposedClass.time_slot_id)
      .eq("semester", proposedClass.semester)
      .eq("academic_year", proposedClass.academic_year)
      .neq("id", classId)

    if (roomConflicts && roomConflicts.length > 0) {
      conflicts.push({
        type: "room_conflict",
        roomId: proposedClass.room_id,
        timeSlotId: proposedClass.time_slot_id,
        conflictingClasses: roomConflicts,
      })
    }
  }

  return conflicts
}

async function validateClassSwap(supabase, class1, class2) {
  const conflicts = []

  // Check if class1 can use class2's slot and room
  const conflicts1 = await validateClassUpdate(supabase, class1.id, {
    time_slot_id: class2.time_slot_id,
    room_id: class2.room_id,
  })

  // Check if class2 can use class1's slot and room
  const conflicts2 = await validateClassUpdate(supabase, class2.id, {
    time_slot_id: class1.time_slot_id,
    room_id: class1.room_id,
  })

  return [...conflicts1, ...conflicts2]
}
