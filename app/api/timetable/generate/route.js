import { createClient } from "@/lib/supabase/server"
import { TimetableGenerator } from "@/lib/timetable-generator"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { semester, academic_year, section_id = null, preferences = {}, save_to_database = false } = body

    if (!semester || !academic_year) {
      return NextResponse.json({ error: "Missing semester or academic year" }, { status: 400 })
    }

    console.log("[v0] Starting timetable generation with params:", { semester, academic_year, section_id, preferences })

    // Fetch all required data with enhanced queries
    const [subjectsRes, facultyRes, roomsRes, timeSlotsRes, sectionsRes, coursesRes] = await Promise.all([
      supabase
        .from("subjects")
        .select(`
          *,
          branches:branch_id (
            id, name, code
          )
        `)
        .order("credits", { ascending: false }),

      supabase
        .from("profiles")
        .select(`
          *,
          faculty:faculty (
            id, employee_id, specialization, max_hours_per_week, branch_id,
            branches:branch_id (
              id, name, code
            )
          )
        `)
        .eq("role", "faculty"),

      supabase.from("rooms").select("*").order("capacity", { ascending: false }),

      supabase.from("time_slots").select("*").order("day_of_week").order("start_time"),

      supabase
        .from("sections")
        .select(`
          *,
          branches:branch_id (
            id, name, code
          ),
          class_teacher:class_teacher_id (
            id, full_name
          )
        `)
        .order("year")
        .order("semester"),

      supabase
        .from("courses")
        .select(`
          *,
          subjects:subject_id (
            id, name, code, credits, subject_type
          ),
          faculty:faculty_id (
            id, full_name, employee_id
          ),
          sections:section_id (
            id, name, year, semester
          )
        `)
        .eq("semester", semester)
        .eq("academic_year", academic_year),
    ])

    // Check for errors
    const errors = [
      subjectsRes.error,
      facultyRes.error,
      roomsRes.error,
      timeSlotsRes.error,
      sectionsRes.error,
      coursesRes.error,
    ].filter(Boolean)
    if (errors.length > 0) {
      console.log("[v0] Database fetch errors:", errors)
      throw new Error(`Failed to fetch required data: ${errors.map((e) => e.message).join(", ")}`)
    }

    // Process and flatten faculty data
    const faculty = facultyRes.data
      .filter((profile) => profile.faculty && profile.faculty.length > 0)
      .map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        department: profile.department,
        employee_id: profile.faculty[0].employee_id,
        specialization: profile.faculty[0].specialization,
        max_hours_per_week: profile.faculty[0].max_hours_per_week || 20,
        branch_id: profile.faculty[0].branch_id,
      }))

    console.log("[v0] Processed data counts:", {
      subjects: subjectsRes.data.length,
      faculty: faculty.length,
      rooms: roomsRes.data.length,
      timeSlots: timeSlotsRes.data.length,
      sections: sectionsRes.data.length,
      courses: coursesRes.data.length,
    })

    // Filter sections if section_id is provided
    let sections = sectionsRes.data
    if (section_id) {
      sections = sections.filter((s) => s.id === section_id)
      if (sections.length === 0) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 })
      }
    }

    // Generate timetable with enhanced algorithm
    const generator = new TimetableGenerator(
      subjectsRes.data,
      faculty,
      roomsRes.data,
      timeSlotsRes.data,
      sections,
      coursesRes.data,
    )

    const result = await generator.generateTimetable(semester, academic_year, section_id, preferences)

    console.log("[v0] Generation completed:", {
      totalClasses: result.schedule.length,
      conflicts: result.conflicts.length,
      stats: result.stats,
    })

    // Save generated timetable to database if requested
    if (save_to_database && result.schedule.length > 0) {
      try {
        // Clear existing classes for the same semester/academic year/sections
        const sectionIds = sections.map((s) => s.id)

        const { error: deleteError } = await supabase
          .from("classes")
          .delete()
          .in("section_id", sectionIds)
          .eq("semester", semester)
          .eq("academic_year", academic_year)

        if (deleteError) {
          console.log("[v0] Error clearing existing classes:", deleteError)
        }

        // Insert new classes
        const classesToInsert = result.schedule.map((scheduledClass) => ({
          subject_id: scheduledClass.subject_id,
          faculty_id: scheduledClass.faculty_id,
          room_id: scheduledClass.room_id,
          time_slot_id: scheduledClass.time_slots[0], // Use first time slot as primary
          section_id: scheduledClass.section_id,
          semester: scheduledClass.semester,
          academic_year: scheduledClass.academic_year,
          max_students: scheduledClass.max_students,
        }))

        const { data: insertedClasses, error: insertError } = await supabase
          .from("classes")
          .insert(classesToInsert)
          .select()

        if (insertError) {
          console.log("[v0] Error saving classes:", insertError)
          result.saveError = insertError.message
        } else {
          console.log("[v0] Successfully saved classes:", insertedClasses?.length || 0)
          result.savedClasses = insertedClasses?.length || 0
        }
      } catch (saveError) {
        console.log("[v0] Exception while saving:", saveError)
        result.saveError = saveError.message
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error generating timetable:", error)
    return NextResponse.json(
      {
        error: "Failed to generate timetable",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const semester = searchParams.get("semester")
    const academic_year = searchParams.get("academic_year")
    const section_id = searchParams.get("section_id")

    if (!semester || !academic_year) {
      return NextResponse.json({ error: "Missing semester or academic year" }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from("classes")
      .select(`
        *,
        subjects:subject_id (
          id, name, code, credits, subject_type
        ),
        faculty:faculty_id (
          id, full_name, employee_id
        ),
        rooms:room_id (
          id, name, type, capacity
        ),
        time_slots:time_slot_id (
          id, day_of_week, start_time, end_time
        ),
        sections:section_id (
          id, name, year, semester,
          branches:branch_id (
            id, name, code
          )
        )
      `)
      .eq("semester", semester)
      .eq("academic_year", academic_year)

    if (section_id) {
      query = query.eq("section_id", section_id)
    }

    const { data: classes, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Transform data for frontend
    const schedule = classes.map((cls) => ({
      id: cls.id,
      subject_id: cls.subject_id,
      faculty_id: cls.faculty_id,
      room_id: cls.room_id,
      section_id: cls.section_id,
      time_slot_id: cls.time_slot_id,
      day_of_week: cls.time_slots?.day_of_week,
      start_time: cls.time_slots?.start_time,
      end_time: cls.time_slots?.end_time,
      subject_name: cls.subjects?.name,
      subject_code: cls.subjects?.code,
      faculty_name: cls.faculty?.full_name,
      room_name: cls.rooms?.name,
      section_name: cls.sections?.name,
      max_students: cls.max_students,
      semester: cls.semester,
      academic_year: cls.academic_year,
      created_at: cls.created_at,
    }))

    return NextResponse.json({
      schedule,
      stats: {
        totalClasses: schedule.length,
        uniqueFaculty: new Set(schedule.map((s) => s.faculty_id)).size,
        uniqueRooms: new Set(schedule.map((s) => s.room_id)).size,
        uniqueSections: new Set(schedule.map((s) => s.section_id)).size,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching timetable:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch timetable",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
