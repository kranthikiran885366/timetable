import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, BookOpen, Users } from "lucide-react"

export default async function FacultyDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get faculty profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get faculty's classes
  const { data: classes } = await supabase
    .from("classes")
    .select(
      `
      *,
      subjects(name, code, credits),
      rooms(name, capacity),
      time_slots(day_of_week, start_time, end_time)
    `,
    )
    .eq("faculty_id", user.id)
    .order("created_at", { ascending: false })

  // Get today's classes
  const today = new Date().getDay() || 7 // Convert Sunday (0) to 7
  const todayClasses = classes?.filter((c) => c.time_slots.day_of_week === today) || []

  // Get unique subjects taught
  const uniqueSubjects = classes ? [...new Set(classes.map((c) => c.subjects.id))] : []

  const getDayName = (dayNumber) => {
    const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return days[dayNumber] || "Unknown"
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome, {profile?.full_name}</h1>
        <p className="text-muted-foreground">Faculty Dashboard - {profile?.department} Department</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSubjects.length}</div>
            <p className="text-xs text-muted-foreground">Different courses</p>
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
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{profile?.department || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Your department</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>{getDayName(today)} Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayClasses.length > 0 ? (
                todayClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">
                        {classItem.subjects.name} ({classItem.subjects.code})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {classItem.time_slots.start_time} - {classItem.time_slots.end_time} • {classItem.rooms.name}
                      </p>
                    </div>
                    <Badge variant="secondary">{classItem.subjects.credits} Credits</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No classes scheduled for today</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common faculty tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/faculty/schedule"
                className="flex items-center gap-3 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">View Full Schedule</p>
                  <p className="text-sm text-muted-foreground">See all your classes this semester</p>
                </div>
              </a>
              <a
                href="/faculty/subjects"
                className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">My Subjects</p>
                  <p className="text-sm text-muted-foreground">Manage your course subjects</p>
                </div>
              </a>
              <a
                href="/faculty/students"
                className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">View Students</p>
                  <p className="text-sm text-muted-foreground">See enrolled students</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
