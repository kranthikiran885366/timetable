"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, MapPin, Clock, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StudentSubjects() {
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchSubjectsData()
  }, [])

  const fetchSubjectsData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get student profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(profileData)

      // Get student's enrolled classes with detailed information
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select(`
          *,
          classes(
            *,
            subjects(name, code, credits, department),
            faculty:profiles!classes_faculty_id_fkey(full_name, email, department),
            rooms(name, capacity, type, building, floor),
            time_slots(day_of_week, start_time, end_time)
          )
        `)
        .eq("student_id", user.id)

      const classesData = enrollments?.map((e) => e.classes) || []
      setClasses(classesData)
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: "Failed to load subjects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDayName = (dayNumber) => {
    const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return days[dayNumber] || "Unknown"
  }

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getSubjectsByDepartment = () => {
    const departments = {}
    classes.forEach((classItem) => {
      const dept = classItem.subjects.department
      if (!departments[dept]) {
        departments[dept] = []
      }
      departments[dept].push(classItem)
    })
    return departments
  }

  const totalCredits = classes.reduce((sum, c) => sum + (c.subjects?.credits || 0), 0)
  const subjectsByDepartment = getSubjectsByDepartment()

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading subjects...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Subjects</h1>
        <p className="text-muted-foreground">
          Enrolled courses for {profile?.full_name} • {totalCredits} total credits
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold">{totalCredits}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{Object.keys(subjectsByDepartment).length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Credits</p>
                <p className="text-2xl font-bold">
                  {classes.length > 0 ? (totalCredits / classes.length).toFixed(1) : 0}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects by Department */}
      {Object.entries(subjectsByDepartment).map(([department, departmentClasses]) => (
        <Card key={department} className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {department} Department
            </CardTitle>
            <CardDescription>
              {departmentClasses.length} subjects • {departmentClasses.reduce((sum, c) => sum + c.subjects.credits, 0)}{" "}
              credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departmentClasses.map((classItem) => (
                <div key={classItem.id} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{classItem.subjects.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{classItem.subjects.code}</p>
                    </div>
                    <Badge variant="secondary">{classItem.subjects.credits} Credits</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Prof. {classItem.faculty.full_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.rooms.name}</span>
                      {classItem.rooms.building && (
                        <Badge variant="outline" className="text-xs">
                          {classItem.rooms.building}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {getDayName(classItem.time_slots.day_of_week)} • {formatTime(classItem.time_slots.start_time)} -{" "}
                        {formatTime(classItem.time_slots.end_time)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Room Type: {classItem.rooms.type}</span>
                      <Badge variant="outline" className="text-xs">
                        Capacity: {classItem.rooms.capacity}
                      </Badge>
                    </div>
                  </div>

                  {classItem.faculty.email && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">Contact: {classItem.faculty.email}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {classes.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No subjects enrolled</h3>
            <p className="text-muted-foreground">You are not currently enrolled in any subjects.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
