"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Edit, Trash2, Building, Users, BookOpen, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { realTimeManager } from "@/lib/real-time"

export default function BranchesPage() {
  const [branches, setBranches] = useState([])
  const [faculty, setFaculty] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    head_of_department: "",
    established_year: new Date().getFullYear(),
    total_semesters: 8,
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

      const [branchesRes, facultyRes] = await Promise.all([
        supabase
          .from("branches")
          .select(`
            *,
            head_of_department:profiles(full_name)
          `)
          .order("name"),
        supabase.from("profiles").select("*").eq("role", "faculty").order("full_name"),
      ])

      if (branchesRes.error) throw branchesRes.error
      if (facultyRes.error) throw facultyRes.error

      setBranches(branchesRes.data || [])
      setFaculty(facultyRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch branches data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealTimeSubscriptions = () => {
    realTimeManager.subscribeToTable("branches", () => {
      fetchData()
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const supabase = createClient()

      if (editingBranch) {
        const { error } = await supabase
          .from("branches")
          .update({
            ...formData,
            head_of_department: formData.head_of_department || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingBranch.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Branch updated successfully",
        })
      } else {
        const { error } = await supabase.from("branches").insert([
          {
            ...formData,
            head_of_department: formData.head_of_department || null,
          },
        ])

        if (error) throw error

        toast({
          title: "Success",
          description: "Branch created successfully",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Error saving branch:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save branch",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      code: branch.code,
      description: branch.description || "",
      head_of_department: branch.head_of_department || "",
      established_year: branch.established_year || new Date().getFullYear(),
      total_semesters: branch.total_semesters || 8,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (branchId) => {
    if (
      !confirm(
        "Are you sure you want to delete this branch? This will also delete all associated sections and courses.",
      )
    ) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("branches").delete().eq("id", branchId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Branch deleted successfully",
      })

      fetchData()
    } catch (error) {
      console.error("Error deleting branch:", error)
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      head_of_department: "",
      established_year: new Date().getFullYear(),
      total_semesters: 8,
    })
    setEditingBranch(null)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading branches...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Branch Management</h1>
          <p className="text-muted-foreground">Manage academic branches and departments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
              <DialogDescription>
                {editingBranch ? "Update branch information" : "Create a new academic branch"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Computer Science Engineering"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="CSE"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Department description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="head_of_department">Head of Department</Label>
                  <Select
                    value={formData.head_of_department}
                    onValueChange={(value) => setFormData({ ...formData, head_of_department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No HOD assigned</SelectItem>
                      {faculty.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="established_year">Established Year</Label>
                  <Input
                    id="established_year"
                    type="number"
                    value={formData.established_year}
                    onChange={(e) => setFormData({ ...formData, established_year: Number.parseInt(e.target.value) })}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_semesters">Total Semesters</Label>
                <Select
                  value={formData.total_semesters.toString()}
                  onValueChange={(value) => setFormData({ ...formData, total_semesters: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 Semesters</SelectItem>
                    <SelectItem value="8">8 Semesters</SelectItem>
                    <SelectItem value="10">10 Semesters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingBranch ? "Update" : "Create"} Branch
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Branch Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With HOD Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.filter((b) => b.head_of_department).length}</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Semesters</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branches.length > 0
                ? Math.round(branches.reduce((sum, b) => sum + b.total_semesters, 0) / branches.length)
                : 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oldest Branch</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branches.length > 0
                ? Math.min(...branches.filter((b) => b.established_year).map((b) => b.established_year)) || "N/A"
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branches Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Academic Branches</CardTitle>
          <CardDescription>Manage all academic branches and their configurations</CardDescription>
        </CardHeader>
        <CardContent>
          {branches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Head of Department</TableHead>
                  <TableHead>Established</TableHead>
                  <TableHead>Semesters</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{branch.name}</div>
                        {branch.description && (
                          <div className="text-sm text-muted-foreground">{branch.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{branch.code}</Badge>
                    </TableCell>
                    <TableCell>
                      {branch.head_of_department?.full_name || (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{branch.established_year || "N/A"}</TableCell>
                    <TableCell>{branch.total_semesters}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(branch)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(branch.id)}
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
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Branches Found</h3>
              <p className="text-muted-foreground mb-4">Create your first academic branch to get started.</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Branch
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
