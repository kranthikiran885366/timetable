import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, MapPin, Calendar } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get statistics
  const [
    { count: totalStudents },
    { count: totalFaculty },
    { count: totalSubjects },
    { count: totalRooms },
    { count: totalClasses },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "faculty"),
    supabase.from("subjects").select("*", { count: "exact", head: true }),
    supabase.from("rooms").select("*", { count: "exact", head: true }),
    supabase.from("classes").select("*", { count: "exact", head: true }),
  ])

  // Get recent activity
  const { data: recentClasses } = await supabase
    .from("classes")
    .select(
      `
      *,
      subjects(name, code),
      faculty:profiles!classes_faculty_id_fkey(full_name),
      rooms(name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your institution's timetable and resources</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFaculty || 0}</div>
            <p className="text-xs text-muted-foreground">Active faculty</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubjects || 0}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms || 0}</div>
            <p className="text-xs text-muted-foreground">Available rooms</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Classes
            </CardTitle>
            <CardDescription>Recently scheduled classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClasses && recentClasses.length > 0 ? (
                recentClasses.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">
                        {classItem.subjects?.name} ({classItem.subjects?.code})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {classItem.faculty?.full_name} • {classItem.rooms?.name}
                      </p>
                    </div>
                    <Badge variant="secondary">{classItem.semester}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No classes scheduled yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/admin/timetable"
                className="flex items-center gap-3 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Generate Timetable</p>
                  <p className="text-sm text-muted-foreground">Create new class schedules</p>
                </div>
              </a>
              <a
                href="/admin/subjects"
                className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Manage Subjects</p>
                  <p className="text-sm text-muted-foreground">Add or edit course subjects</p>
                </div>
              </a>
              <a
                href="/admin/faculty"
                className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Manage Faculty</p>
                  <p className="text-sm text-muted-foreground">Add or edit faculty members</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
