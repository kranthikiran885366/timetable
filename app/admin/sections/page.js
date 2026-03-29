"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Users, BookOpen, Calendar, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { realTimeManager } from "@/lib/real-time"

export default function SectionsPage() {
  const [sections, setSections] = useState([])
  const [branches, setBranches] = useState([])
  const [faculty, setFaculty] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    branch_id: "",
    year: 1,
    semester: 1,
    academic_year: "2024-2025",
    max_students: 60,
    class_teacher_id: "",
  })

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
      const supabase = createClient()

      const [sectionsRes, branchesRes, facultyRes] = await Promise.all([
        supabase
          .from("sections")
          .select(`
            *,
            branch:branches(name, code),
            class_teacher:faculty(id, profiles(full_name))
          `)
          .order("branch_id")
          .order("year")
          .order("semester"),
        supabase.from("branches").select("*").order("name"),
        supabase
          .from("faculty")
          .select(`
            id,
            profiles(full_name, department)
          `)
          .order("profiles(full_name)"),
      ])

      if (sectionsRes.error) throw sectionsRes.error
      if (branchesRes.error) throw branchesRes.error
      if (facultyRes.error) throw facultyRes.error

      setSections(sectionsRes.data || [])
      setBranches(branchesRes.data || [])
      setFaculty(facultyRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch sections data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealTimeSubscriptions = () => {
    realTimeManager.subscribeToTable("sections", () => {
      fetchData()
    })
    realTimeManager.subscribeToTable("branches", () => {
      fetchData()
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const supabase = createClient()

      if (editingSection) {
        const { error } = await supabase
          .from("sections")
          .update({
            ...formData,
            class_teacher_id: formData.class_teacher_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSection.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Section updated successfully",
        })
      } else {
        const { error } = await supabase.from("sections").insert([
          {
            ...formData,
            class_teacher_id: formData.class_teacher_id || null,
          },
        ])

        if (error) throw error

        toast({
          title: "Success",
          description: "Section created successfully",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Error saving section:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save section",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (section) => {
    setEditingSection(section)
    setFormData({
      name: section.name,
      branch_id: section.branch_id,
      year: section.year,
      semester: section.semester,
      academic_year: section.academic_year,
      max_students: section.max_students,
      class_teacher_id: section.class_teacher_id || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (sectionId) => {
    if (!confirm("Are you sure you want to delete this section? This will also delete all associated courses.")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("sections").delete().eq("id", sectionId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Section deleted successfully",
      })

      fetchData()
    } catch (error) {
      console.error("Error deleting section:", error)
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      branch_id: "",
      year: 1,
      semester: 1,
      academic_year: "2024-2025",
      max_students: 60,
      class_teacher_id: "",
    })
    setEditingSection(null)
  }

  const getYearName = (year) => {
    const yearNames = { 1: "First Year", 2: "Second Year", 3: "Third Year", 4: "Fourth Year" }
    return yearNames[year] || `Year ${year}`
  }

  const getSemesterName = (semester) => {
    const semesterNames = {
      1: "Semester I",
      2: "Semester II",
      3: "Semester III",
      4: "Semester IV",
      5: "Semester V",
      6: "Semester VI",
      7: "Semester VII",
      8: "Semester VIII",
    }
    return semesterNames[semester] || `Semester ${semester}`
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading sections...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Section Management</h1>
          <p className="text-muted-foreground">Manage academic sections with year, semester, and branch assignments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingSection ? "Edit Section" : "Add New Section"}</DialogTitle>
              <DialogDescription>
                {editingSection ? "Update section information" : "Create a new academic section"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Section Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Section A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_id">Branch</Label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => setFormData({ ...formData, year: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">First Year</SelectItem>
                      <SelectItem value="2">Second Year</SelectItem>
                      <SelectItem value="3">Third Year</SelectItem>
                      <SelectItem value="4">Fourth Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select
                    value={formData.semester.toString()}
                    onValueChange={(value) => setFormData({ ...formData, semester: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="2024-2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_students">Max Students</Label>
                  <Input
                    id="max_students"
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: Number.parseInt(e.target.value) })}
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class_teacher_id">Class Teacher</Label>
                <Select
                  value={formData.class_teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, class_teacher_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class teacher (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No class teacher assigned</SelectItem>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.profiles?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingSection ? "Update" : "Create"} Section
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Section Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.reduce((sum, s) => sum + s.max_students, 0)}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Class Teacher</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.filter((s) => s.class_teacher_id).length}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Years</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(sections.map((s) => s.academic_year)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sections Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Academic Sections</CardTitle>
          <CardDescription>
            Manage all academic sections with their year, semester, and branch assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Year & Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Max Students</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell>
                      <div className="font-medium">{section.name}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{section.branch?.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {section.branch?.code}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getYearName(section.year)}</div>
                        <div className="text-sm text-muted-foreground">{getSemesterName(section.semester)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{section.academic_year}</TableCell>
                    <TableCell>
                      {section.class_teacher?.profiles?.full_name || (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{section.max_students}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(section)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(section.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sections Found</h3>
              <p className="text-muted-foreground mb-4">Create your first academic section to get started.</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Section
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
