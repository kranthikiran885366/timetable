"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, BookOpen, GraduationCap, Users, MapPin } from "lucide-react"
import { realTimeManager } from "@/lib/real-time"
import { useToast } from "@/hooks/use-toast"
import { RealTimeStatus } from "@/components/real-time-status"
import { NotificationCenter } from "@/components/notification-center"

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null)
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchStudentData()
    setupRealTimeSubscriptions()

    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => {
      clearInterval(timeInterval)
      realTimeManager.unsubscribeAll()
    }
  }, [])

  const fetchStudentData = async () => {
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
            faculty:profiles!classes_faculty_id_fkey(full_name, email),
            rooms(name, capacity, type, building, floor),
            time_slots(day_of_week, start_time, end_time)
          )
        `)
        .eq("student_id", user.id)

      const classesData = enrollments?.map((e) => e.classes) || []
      setClasses(classesData)
      setIsConnected(true)
    } catch (error) {
      console.error("Error fetching student data:", error)
      setIsConnected(false)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealTimeSubscriptions = () => {
    // Subscribe to timetable changes that might affect the student
    realTimeManager.subscribeToTimetableChanges((payload) => {
      console.log("[v0] Student timetable update:", payload)
      fetchStudentData() // Refresh data when timetable changes

      if (payload.eventType === "INSERT") {
        toast({
          title: "Schedule Updated",
          description: "New classes have been added to the timetable.",
        })
      } else if (payload.eventType === "DELETE") {
        toast({
          title: "Schedule Changed",
          description: "Some classes have been removed from the timetable.",
          variant: "destructive",
        })
      }
    })

    // Subscribe to subject changes
    realTimeManager.subscribeToSubjectChanges((payload) => {
      if (payload.eventType === "UPDATE") {
        fetchStudentData() // Refresh to get updated subject info
      }
    })

    setIsConnected(true)
  }

  // Get today's classes
  const today = new Date().getDay() || 7 // Convert Sunday (0) to 7
  const todayClasses = classes.filter((c) => c.time_slots.day_of_week === today)

  // Get next class
  const getNextClass = () => {
    const now = currentTime
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    return todayClasses
      .filter((c) => c.time_slots.start_time > currentTimeStr)
      .sort((a, b) => a.time_slots.start_time.localeCompare(b.time_slots.start_time))[0]
  }

  // Calculate total credits
  const totalCredits = classes.reduce((sum, c) => sum + (c.subjects?.credits || 0), 0)

  // Get current class
  const getCurrentClass = () => {
    const now = currentTime
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    return todayClasses.find(
      (c) => c.time_slots.start_time <= currentTimeStr && c.time_slots.end_time >= currentTimeStr,
    )
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

  const nextClass = getNextClass()
  const currentClass = getCurrentClass()

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with real-time status */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {profile?.full_name}</h1>
          <p className="text-muted-foreground">Student Dashboard - {profile?.department} Department</p>
        </div>
        <div className="flex items-center gap-2">
          <RealTimeStatus />
          <NotificationCenter />
        </div>
      </div>

      {/* Current/Next Class Alert */}
      {currentClass && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <div>
                <p className="font-semibold text-foreground">Currently in class</p>
                <p className="text-sm text-muted-foreground">
                  {currentClass.subjects.name} • {currentClass.rooms.name} • Ends at{" "}
                  {formatTime(currentClass.time_slots.end_time)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentClass && nextClass && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-semibold text-foreground">Next class</p>
                <p className="text-sm text-muted-foreground">
                  {nextClass.subjects.name} • {nextClass.rooms.name} • {formatTime(nextClass.time_slots.start_time)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits}</div>
            <p className="text-xs text-muted-foreground">Credit hours</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayClasses.length}</div>
            <p className="text-xs text-muted-foreground">{getDayName(today)}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{profile?.department || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Your major</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Classes
            </CardTitle>
            <CardDescription>{getDayName(today)} Schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayClasses.length > 0 ? (
                todayClasses
                  .sort((a, b) => a.time_slots.start_time.localeCompare(b.time_slots.start_time))
                  .map((classItem) => {
                    const isCurrentClass = currentClass?.id === classItem.id
                    const isPastClass =
                      classItem.time_slots.end_time <
                      `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`

                    return (
                      <div
                        key={classItem.id}
                        className={`p-4 rounded-lg border ${
                          isCurrentClass
                            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                            : isPastClass
                              ? "border-gray-300 bg-gray-50 dark:bg-gray-950/20 opacity-60"
                              : "border-border bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-foreground">{classItem.subjects.name}</p>
                              {isCurrentClass && (
                                <Badge variant="default" className="bg-green-500">
                                  Live
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {classItem.subjects.code} • {classItem.subjects.credits} Credits
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(classItem.time_slots.start_time)} -{" "}
                                {formatTime(classItem.time_slots.end_time)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {classItem.rooms.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Prof. {classItem.faculty.full_name}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No classes scheduled for today</p>
                  <p className="text-sm text-muted-foreground">Enjoy your free day!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common student tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto p-4 bg-transparent">
                <a href="/student/timetable">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">View Full Timetable</p>
                    <p className="text-sm text-muted-foreground">See your complete weekly schedule</p>
                  </div>
                </a>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto p-4 bg-transparent">
                <a href="/student/subjects">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">My Subjects</p>
                    <p className="text-sm text-muted-foreground">View enrolled courses and details</p>
                  </div>
                </a>
              </Button>

              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto p-4 bg-transparent">
                <a href="/student/profile">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">My Profile</p>
                    <p className="text-sm text-muted-foreground">Update personal information</p>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Subjects */}
      {classes.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Enrolled Subjects</CardTitle>
            <CardDescription>Your current semester courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <div key={classItem.id} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">{classItem.subjects.name}</h4>
                    <Badge variant="outline">{classItem.subjects.credits} Credits</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{classItem.subjects.code}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Prof. {classItem.faculty.full_name}</p>
                    <p>
                      {classItem.rooms.name} • {classItem.rooms.building}
                    </p>
                    <p>
                      {getDayName(classItem.time_slots.day_of_week)} {formatTime(classItem.time_slots.start_time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
