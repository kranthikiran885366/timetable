"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Check, AlertTriangle, BookOpen, Users, Clock, Settings, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TimetableGenerator } from "@/lib/timetable-generator"

const WIZARD_STEPS = [
  { id: 1, title: "Select Section", description: "Choose the section for course assignment" },
  { id: 2, title: "Assign Subjects", description: "Select subjects and assign faculty" },
  { id: 3, title: "Configure Resources", description: "Allocate rooms and time preferences" },
  { id: 4, title: "Generate & Review", description: "Generate timetable and review conflicts" },
]

export default function CourseWizardPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Data states
  const [branches, setBranches] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [faculty, setFaculty] = useState([])
  const [rooms, setRooms] = useState([])
  const [timeSlots, setTimeSlots] = useState([])

  // Wizard states
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState("")
  const [courseAssignments, setCourseAssignments] = useState([])
  const [resourcePreferences, setResourcePreferences] = useState({
    preferredRooms: [],
    timePreferences: [],
    avoidTimeSlots: [],
  })
  const [generatedTimetable, setGeneratedTimetable] = useState(null)
  const [conflicts, setConflicts] = useState([])

  const { toast } = useToast()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchSectionsForBranch(selectedBranch)
      fetchSubjectsForBranch(selectedBranch)
    }
  }, [selectedBranch])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const [branchesRes, facultyRes, roomsRes, timeSlotsRes] = await Promise.all([
        supabase.from("branches").select("*").order("name"),
        supabase
          .from("faculty")
          .select(`
            id,
            profiles(full_name, department),
            specialization,
            max_hours_per_week
          `)
          .order("profiles(full_name)"),
        supabase.from("rooms").select("*").order("name"),
        supabase.from("time_slots").select("*").order("day_of_week").order("start_time"),
      ])

      if (branchesRes.error) throw branchesRes.error
      if (facultyRes.error) throw facultyRes.error
      if (roomsRes.error) throw roomsRes.error
      if (timeSlotsRes.error) throw timeSlotsRes.error

      setBranches(branchesRes.data || [])
      setFaculty(facultyRes.data || [])
      setRooms(roomsRes.data || [])
      setTimeSlots(timeSlotsRes.data || [])
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to load wizard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSectionsForBranch = async (branchId) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("sections")
        .select(`
          *,
          branch:branches(name, code)
        `)
        .eq("branch_id", branchId)
        .order("year")
        .order("semester")

      if (error) throw error
      setSections(data || [])
    } catch (error) {
      console.error("Error fetching sections:", error)
    }
  }

  const fetchSubjectsForBranch = async (branchId) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("subjects").select("*").eq("branch_id", branchId).order("name")

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const handleStepChange = (step) => {
    if (step < currentStep || canProceedToStep(step)) {
      setCurrentStep(step)
    }
  }

  const canProceedToStep = (step) => {
    switch (step) {
      case 2:
        return selectedSection !== null
      case 3:
        return courseAssignments.length > 0
      case 4:
        return courseAssignments.every((assignment) => assignment.faculty_id && assignment.subject_id)
      default:
        return true
    }
  }

  const handleSectionSelect = (section) => {
    setSelectedSection(section)
    // Initialize course assignments for selected subjects
    const initialAssignments = subjects.map((subject) => ({
      id: `${section.id}-${subject.id}`,
      subject_id: subject.id,
      section_id: section.id,
      faculty_id: "",
      course_type: subject.subject_type || "theory",
      hours_per_week: subject.credits || 3,
      subject,
    }))
    setCourseAssignments(initialAssignments)
  }

  const updateCourseAssignment = (assignmentId, field, value) => {
    setCourseAssignments((prev) =>
      prev.map((assignment) => (assignment.id === assignmentId ? { ...assignment, [field]: value } : assignment)),
    )
  }

  const toggleRoomPreference = (roomId) => {
    setResourcePreferences((prev) => ({
      ...prev,
      preferredRooms: prev.preferredRooms.includes(roomId)
        ? prev.preferredRooms.filter((id) => id !== roomId)
        : [...prev.preferredRooms, roomId],
    }))
  }

  const generateTimetable = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 15, 90))
      }, 300)

      // Prepare data for generation
      const validAssignments = courseAssignments.filter((assignment) => assignment.faculty_id && assignment.subject_id)

      // Create courses in database
      const supabase = createClient()
      const coursesToCreate = validAssignments.map((assignment) => ({
        subject_id: assignment.subject_id,
        section_id: assignment.section_id,
        faculty_id: assignment.faculty_id,
        semester: selectedSection.semester.toString(),
        academic_year: selectedSection.academic_year,
        course_type: assignment.course_type,
        hours_per_week: assignment.hours_per_week,
      }))

      // Delete existing courses for this section
      await supabase.from("courses").delete().eq("section_id", selectedSection.id)

      // Insert new courses
      const { data: createdCourses, error: coursesError } = await supabase
        .from("courses")
        .insert(coursesToCreate)
        .select()

      if (coursesError) throw coursesError

      // Generate timetable using the algorithm
      const generator = new TimetableGenerator(
        subjects.filter((s) => validAssignments.some((a) => a.subject_id === s.id)),
        faculty.filter((f) => validAssignments.some((a) => a.faculty_id === f.id)),
        resourcePreferences.preferredRooms.length > 0
          ? rooms.filter((r) => resourcePreferences.preferredRooms.includes(r.id))
          : rooms,
        timeSlots.filter((ts) => !resourcePreferences.avoidTimeSlots.includes(ts.id)),
      )

      const result = generator.generateTimetable(selectedSection.semester.toString(), selectedSection.academic_year)

      clearInterval(progressInterval)
      setGenerationProgress(100)

      setGeneratedTimetable(result)
      setConflicts(result.conflicts || [])

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
      const supabase = createClient()

      // Save generated classes
      const classesToSave = generatedTimetable.schedule.map((classItem) => ({
        subject_id: classItem.subject_id,
        faculty_id: classItem.faculty_id,
        room_id: classItem.room_id,
        time_slot_id: classItem.time_slot_id,
        semester: selectedSection.semester.toString(),
        academic_year: selectedSection.academic_year,
        max_students: classItem.max_students,
      }))

      // Delete existing classes for this section
      await supabase
        .from("classes")
        .delete()
        .eq("semester", selectedSection.semester.toString())
        .eq("academic_year", selectedSection.academic_year)

      // Insert new classes
      const { error } = await supabase.from("classes").insert(classesToSave)

      if (error) throw error

      toast({
        title: "Success",
        description: "Timetable saved successfully!",
      })

      // Reset wizard
      setCurrentStep(1)
      setSelectedSection(null)
      setSelectedBranch("")
      setCourseAssignments([])
      setGeneratedTimetable(null)
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
        <div className="text-center">Loading course wizard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Course Assignment Wizard</h1>
        <p className="text-muted-foreground">4-step process to create and assign courses with timetable generation</p>
      </div>

      {/* Progress Bar */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer transition-colors ${
                    currentStep >= step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                  onClick={() => handleStepChange(step.id)}
                >
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-muted-foreground"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / WIZARD_STEPS.length) * 100} className="w-full" />
          <div className="mt-2 text-center">
            <h3 className="font-semibold">{WIZARD_STEPS[currentStep - 1]?.title}</h3>
            <p className="text-sm text-muted-foreground">{WIZARD_STEPS[currentStep - 1]?.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Step 1: Select Section
            </CardTitle>
            <CardDescription>Choose the branch and section for course assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Select Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBranch && sections.length > 0 && (
              <div className="space-y-2">
                <Label>Available Sections</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.map((section) => (
                    <Card
                      key={section.id}
                      className={`cursor-pointer transition-colors ${
                        selectedSection?.id === section.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleSectionSelect(section)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium">{section.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Year {section.year}, Semester {section.semester}
                        </div>
                        <div className="text-sm text-muted-foreground">{section.academic_year}</div>
                        <Badge variant="outline" className="mt-2">
                          {section.max_students} students
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && selectedSection && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Step 2: Assign Subjects
            </CardTitle>
            <CardDescription>
              Assign subjects to {selectedSection.name} and select faculty for each course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courseAssignments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Course Type</TableHead>
                    <TableHead>Hours/Week</TableHead>
                    <TableHead>Assigned Faculty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.subject?.name}</div>
                          <div className="text-sm text-muted-foreground">{assignment.subject?.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assignment.course_type}
                          onValueChange={(value) => updateCourseAssignment(assignment.id, "course_type", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="theory">Theory</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                            <SelectItem value="tutorial">Tutorial</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={assignment.hours_per_week}
                          onChange={(e) =>
                            updateCourseAssignment(assignment.id, "hours_per_week", Number.parseInt(e.target.value))
                          }
                          className="w-20"
                          min="1"
                          max="10"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assignment.faculty_id}
                          onValueChange={(value) => updateCourseAssignment(assignment.id, "faculty_id", value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select faculty" />
                          </SelectTrigger>
                          <SelectContent>
                            {faculty.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.profiles?.full_name}
                                {f.specialization && (
                                  <span className="text-muted-foreground"> - {f.specialization}</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Subjects Available</h3>
                <p className="text-muted-foreground">
                  No subjects found for the selected branch. Please add subjects first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Step 3: Configure Resources
            </CardTitle>
            <CardDescription>Set room preferences and time constraints for optimal scheduling</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rooms" className="space-y-4">
              <TabsList>
                <TabsTrigger value="rooms">Room Preferences</TabsTrigger>
                <TabsTrigger value="time">Time Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="rooms" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Preferred Rooms</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select rooms to prioritize for this section (optional)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((room) => (
                      <div key={room.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`room-${room.id}`}
                          checked={resourcePreferences.preferredRooms.includes(room.id)}
                          onCheckedChange={() => toggleRoomPreference(room.id)}
                        />
                        <Label htmlFor={`room-${room.id}`} className="flex-1">
                          <div className="font-medium">{room.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {room.type} - Capacity: {room.capacity}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="time" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Time Slot Preferences</h4>
                  <p className="text-sm text-muted-foreground mb-4">Configure time preferences and constraints</p>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Time preferences will be implemented in the next version. Currently using default scheduling
                      algorithm.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Step 4: Generate & Review
              </CardTitle>
              <CardDescription>Generate timetable and review the results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={generateTimetable}
                  disabled={isGenerating || courseAssignments.length === 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Timetable
                    </>
                  )}
                </Button>

                {generatedTimetable && (
                  <Button onClick={saveTimetable} variant="outline">
                    <Check className="h-4 w-4 mr-2" />
                    Save Timetable
                  </Button>
                )}
              </div>

              {isGenerating && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Generating timetable...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="w-full" />
                </div>
              )}

              {generatedTimetable && (
                <Tabs defaultValue="schedule" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="schedule">Generated Schedule</TabsTrigger>
                    <TabsTrigger value="conflicts">Conflicts ({conflicts.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="schedule">
                    {generatedTimetable.schedule.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Faculty</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Day</TableHead>
                            <TableHead>Time</TableHead>
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
                                <TableCell>{facultyMember?.profiles?.full_name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{room?.name}</Badge>
                                </TableCell>
                                <TableCell>{getDayName(timeSlot?.day_of_week)}</TableCell>
                                <TableCell>
                                  {timeSlot?.start_time} - {timeSlot?.end_time}
                                </TableCell>
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
                          Unable to generate any classes. Check conflicts for details.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="conflicts">
                    {conflicts.length > 0 ? (
                      <div className="space-y-3">
                        {conflicts.map((conflict, index) => (
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
                        <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Conflicts Found</h3>
                        <p className="text-muted-foreground">
                          All classes were scheduled successfully without conflicts.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
          disabled={currentStep === 4 || !canProceedToStep(currentStep + 1)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
