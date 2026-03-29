"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Users, Mail, Phone, MapPin, Clock, Wifi, WifiOff } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { realTimeManager } from "@/lib/real-time"
import { useToast } from "@/hooks/use-toast"

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    department: "",
    employee_id: "",
    specialization: "",
    max_hours_per_week: 20,
    phone: "",
    office_location: "",
  })

  const { toast } = useToast()

  const departments = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
    "Economics",
    "Psychology",
    "Engineering",
  ]

  useEffect(() => {
    fetchFaculty()
    setupRealTimeSubscription()

    return () => {
      realTimeManager.unsubscribeFromTable("profiles", "role=eq.faculty")
    }
  }, [])

  const fetchFaculty = async () => {
    try {
      const { faculty: data } = await apiClient.getFaculty()
      setFaculty(data || [])
      setIsConnected(true)
    } catch (error) {
      console.error("Error fetching faculty:", error)
      setIsConnected(false)
      toast({
        title: "Error",
        description: "Failed to fetch faculty. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealTimeSubscription = () => {
    realTimeManager.subscribeToFacultyChanges((payload) => {
      console.log("[v0] Real-time faculty update:", payload)

      if (payload.eventType === "INSERT") {
        setFaculty((prev) => [...prev, payload.new])
        toast({
          title: "Faculty Added",
          description: `${payload.new.full_name} has been added to the faculty.`,
        })
      } else if (payload.eventType === "UPDATE") {
        setFaculty((prev) => prev.map((f) => (f.id === payload.new.id ? payload.new : f)))
        toast({
          title: "Faculty Updated",
          description: `${payload.new.full_name}'s information has been updated.`,
        })
      } else if (payload.eventType === "DELETE") {
        setFaculty((prev) => prev.filter((f) => f.id !== payload.old.id))
        toast({
          title: "Faculty Removed",
          description: `Faculty member has been removed.`,
        })
      }
    })
    setIsConnected(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingFaculty) {
        // Update existing faculty
        await apiClient.updateFaculty(editingFaculty.id, formData)
      } else {
        // Create new faculty
        await apiClient.createFaculty(formData)
      }

      setIsDialogOpen(false)
      setEditingFaculty(null)
      resetForm()

      toast({
        title: "Success",
        description: `Faculty ${editingFaculty ? "updated" : "created"} successfully.`,
      })
    } catch (error) {
      console.error("Error saving faculty:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingFaculty ? "update" : "create"} faculty member.`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (facultyMember) => {
    setEditingFaculty(facultyMember)
    setFormData({
      email: facultyMember.email || "",
      full_name: facultyMember.full_name || "",
      department: facultyMember.department || "",
      employee_id: facultyMember.employee_id || "",
      specialization: facultyMember.specialization || "",
      max_hours_per_week: facultyMember.max_hours_per_week || 20,
      phone: facultyMember.phone || "",
      office_location: facultyMember.office_location || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this faculty member?")) {
      try {
        await apiClient.deleteFaculty(id)
        toast({
          title: "Success",
          description: "Faculty member deleted successfully.",
        })
      } catch (error) {
        console.error("Error deleting faculty:", error)
        toast({
          title: "Error",
          description: "Failed to delete faculty member.",
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      full_name: "",
      department: "",
      employee_id: "",
      specialization: "",
      max_hours_per_week: 20,
      phone: "",
      office_location: "",
    })
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading faculty...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Faculty Management</h1>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" title="Real-time connected" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" title="Real-time disconnected" />
            )}
          </div>
          <p className="text-muted-foreground">Manage faculty members and their information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFaculty ? "Edit Faculty Member" : "Add New Faculty Member"}</DialogTitle>
              <DialogDescription>
                {editingFaculty ? "Update the faculty member's information" : "Create a new faculty member profile"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.smith@university.edu"
                    required
                    disabled={editingFaculty} // Don't allow email changes for existing faculty
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="EMP001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office_location">Office Location</Label>
                  <Input
                    id="office_location"
                    value={formData.office_location}
                    onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                    placeholder="Building A, Room 201"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Textarea
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="Machine Learning, Data Science, Artificial Intelligence"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_hours_per_week">Maximum Hours Per Week</Label>
                <Input
                  id="max_hours_per_week"
                  type="number"
                  value={formData.max_hours_per_week}
                  onChange={(e) => setFormData({ ...formData, max_hours_per_week: Number.parseInt(e.target.value) })}
                  min="1"
                  max="40"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingFaculty ? "Update Faculty" : "Add Faculty"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingFaculty(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map((facultyMember) => (
          <Card key={facultyMember.id} className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(facultyMember.full_name || "Unknown")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{facultyMember.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Badge variant="outline">{facultyMember.employee_id}</Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(facultyMember)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(facultyMember.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <Badge variant="secondary">{facultyMember.department}</Badge>
                </div>

                {facultyMember.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{facultyMember.email}</span>
                  </div>
                )}

                {facultyMember.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{facultyMember.phone}</span>
                  </div>
                )}

                {facultyMember.office_location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{facultyMember.office_location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Max Hours:</span>
                  <Badge variant="outline">{facultyMember.max_hours_per_week || 20}/week</Badge>
                </div>
              </div>

              {facultyMember.specialization && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Specialization:</strong> {facultyMember.specialization}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {faculty.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No faculty members found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first faculty member</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
