"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Play, Save, AlertTriangle, CheckCircle, Clock, Users, MapPin, Wifi, WifiOff } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { realTimeManager } from "@/lib/real-time"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function TimetablePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [semester, setSemester] = useState("Fall 2024")
  const [academicYear, setAcademicYear] = useState("2024-2025")
  const [generatedTimetable, setGeneratedTimetable] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [faculty, setFaculty] = useState([])
  const [rooms, setRooms] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    setupRealTimeSubscriptions()

    return () => {
      realTimeManager.unsubscribeAll()
    }
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [subjectsRes, facultyRes, roomsRes] = await Promise.all([
        apiClient.getSubjects(),
        apiClient.getFaculty(),
        apiClient.getRooms(),
      ])

      setSubjects(subjectsRes.subjects || [])
      setFaculty(facultyRes.faculty || [])
      setRooms(roomsRes.rooms || [])

      const supabase = createClient()
      const { data: timeSlotsData } = await supabase
        .from("time_slots")
        .select("*")
        .order("day_of_week")
        .order("start_time")

      setTimeSlots(timeSlotsData || [])
      setIsConnected(true)
    } catch (error) {
      console.error("Error fetching data:", error)
      setIsConnected(false)
      toast({
        title: "Error",
        description: "Failed to fetch data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealTimeSubscriptions = () => {
    realTimeManager.subscribeToTimetableChanges((payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
        toast({
          title: "Timetable Updated",
          description: "The timetable has been modified by another user.",
        })
      }
    })

    realTimeManager.subscribeToSubjectChanges(() => {
      fetchData()
    })

    realTimeManager.subscribeToFacultyChanges(() => {
      fetchData()
    })

    realTimeManager.subscribeToRoomChanges(() => {
      fetchData()
    })

    setIsConnected(true)
  }

  const generateTimetable = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await apiClient.generateTimetable({
        semester,
        academic_year: academicYear,
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      setGeneratedTimetable(result)

      toast({
        title: "Generation Complete",
        description: `Generated ${result.schedule.length} classes with ${result.conflicts.length} conflicts.`,
      })
    } catch (error) {
      console.error("Error generating timetable:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate timetable. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const saveTimetable = async () => {
    if (!generatedTimetable || !generatedTimetable.schedule) return

    try {
      await apiClient.saveTimetable({
        schedule: generatedTimetable.schedule,
        semester,
        academic_year: academicYear,
      })

      toast({
        title: "Success",
        description: "Timetable saved successfully!",
      })

      realTimeManager.broadcastEvent("timetable_updates", "timetable_saved", {
        semester,
        academic_year: academicYear,
        classes_count: generatedTimetable.schedule.length,
      })
    } catch (error) {
      console.error("Error saving timetable:", error)
      toast({
        title: "Error",
        description: "Failed to save timetable. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getDayName = (dayNumber) => {
    const days = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return days[dayNumber] || "Unknown"
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading timetable generator...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">Timetable Generator</h1>
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" title="Real-time connected" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" title="Real-time disconnected" />
          )}
        </div>
        <p className="text-muted-foreground">Generate automatic class schedules with conflict resolution</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generate New Timetable
          </CardTitle>
          <CardDescription>Configure semester details and generate optimized class schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Fall 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024-2025"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={generateTimetable}
                disabled={isGenerating || subjects.length === 0}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Timetable
                  </>
                )}
              </Button>
            </div>
          </div>

          {isGenerating && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Generating timetable...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={subjects.length > 0 ? "default" : "destructive"}>{subjects.length} Subjects</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={faculty.length > 0 ? "default" : "destructive"}>{faculty.length} Faculty</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={rooms.length > 0 ? "default" : "destructive"}>{rooms.length} Rooms</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={timeSlots.length > 0 ? "default" : "destructive"}>{timeSlots.length} Time Slots</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedTimetable && (
        <Tabs defaultValue="schedule" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="schedule">Generated Schedule</TabsTrigger>
              <TabsTrigger value="conflicts">Conflicts & Issues</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            {generatedTimetable.schedule.length > 0 && (
              <Button onClick={saveTimetable} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="h-4 w-4 mr-2" />
                Save Timetable
              </Button>
            )}
          </div>

          <TabsContent value="schedule">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Generated Class Schedule</CardTitle>
                <CardDescription>
                  {generatedTimetable.schedule.length} classes scheduled for {semester} {academicYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedTimetable.schedule.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Capacity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedTimetable.schedule.map((classItem, index) => {
                        const subject = subjects.find((s) => s.id === classItem.subject_id)
                        const facultyMember = faculty.find((f) => f.id === classItem.faculty_id)
                        const room = rooms.find((r) => r.id === classItem.room_id)
                        const timeSlot = timeSlots.find((t) => t.id === classItem.time_slot_id)

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{subject?.name}</div>
                                <div className="text-sm text-muted-foreground">{subject?.code}</div>
                              </div>
                            </TableCell>
                            <TableCell>{facultyMember?.full_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{room?.name}</Badge>
                            </TableCell>
                            <TableCell>{getDayName(timeSlot?.day_of_week)}</TableCell>
                            <TableCell>
                              {timeSlot?.start_time} - {timeSlot?.end_time}
                            </TableCell>
                            <TableCell>{classItem.max_students}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Classes Generated</h3>
                    <p className="text-muted-foreground">
                      Unable to generate any classes. Check conflicts tab for details.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conflicts">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Conflicts & Issues</CardTitle>
                <CardDescription>Issues encountered during timetable generation</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedTimetable.conflicts.length > 0 ? (
                  <div className="space-y-3">
                    {generatedTimetable.conflicts.map((conflict, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{conflict.type.replace("_", " ").toUpperCase()}:</strong> {conflict.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Conflicts Found</h3>
                    <p className="text-muted-foreground">All classes were scheduled successfully without conflicts.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generatedTimetable.stats.totalClasses}</div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faculty Utilized</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generatedTimetable.stats.uniqueFaculty}</div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rooms Used</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generatedTimetable.stats.uniqueRooms}</div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generatedTimetable.stats.utilizationRate}%</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
