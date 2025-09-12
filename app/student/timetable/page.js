"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StudentTimetable() {
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  const { toast } = useToast()
  const supabase = createClient()

  const days = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
    { id: 7, name: "Sunday" },
  ]

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

  useEffect(() => {
    fetchTimetableData()
  }, [])

  const fetchTimetableData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get student profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(profileData)

      // Get student's enrolled classes
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select(`
          *,
          classes(
            *,
            subjects(name, code, credits, department),
            faculty:profiles!classes_faculty_id_fkey(full_name),
            rooms(name, capacity, type, building),
            time_slots(day_of_week, start_time, end_time)
          )
        `)
        .eq("student_id", user.id)

      const classesData = enrollments?.map((e) => e.classes) || []
      setClasses(classesData)
    } catch (error) {
      console.error("Error fetching timetable:", error)
      toast({
        title: "Error",
        description: "Failed to load timetable. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getClassForSlot = (dayId, timeSlot) => {
    return classes.find((classItem) => {
      const startTime = classItem.time_slots.start_time.substring(0, 5)
      return classItem.time_slots.day_of_week === dayId && startTime === timeSlot
    })
  }

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading timetable...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Timetable</h1>
        <p className="text-muted-foreground">
          Weekly schedule for {profile?.full_name} • {profile?.department} Department
        </p>
      </div>

      {/* Timetable Grid */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>Your complete class schedule for the current semester</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="p-3 font-semibold text-center bg-muted rounded-lg">Time</div>
                {days.map((day) => (
                  <div key={day.id} className="p-3 font-semibold text-center bg-muted rounded-lg">
                    {day.name}
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {timeSlots.map((timeSlot) => (
                <div key={timeSlot} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="p-3 text-center bg-muted/50 rounded-lg font-medium">
                    {formatTime(timeSlot + ":00")}
                  </div>
                  {days.map((day) => {
                    const classItem = getClassForSlot(day.id, timeSlot)
                    return (
                      <div key={`${day.id}-${timeSlot}`} className="min-h-[80px]">
                        {classItem ? (
                          <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg h-full">
                            <div className="text-sm font-medium text-foreground mb-1">{classItem.subjects.name}</div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {classItem.subjects.code}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {classItem.rooms.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {classItem.faculty.full_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(classItem.time_slots.start_time)} -{" "}
                                {formatTime(classItem.time_slots.end_time)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 bg-muted/30 rounded-lg h-full opacity-50"></div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold">{classes.reduce((sum, c) => sum + (c.subjects?.credits || 0), 0)}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Rooms</p>
                <p className="text-2xl font-bold">{new Set(classes.map((c) => c.rooms.name)).size}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
