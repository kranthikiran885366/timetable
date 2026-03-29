"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
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
import { Plus, Edit, Trash2, BookOpen, Wifi, WifiOff } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { realTimeManager } from "@/lib/real-time"
import { useToast } from "@/hooks/use-toast"

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department: "",
    credits: 3,
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchSubjects()
    setupRealTimeSubscription()

    return () => {
      realTimeManager.unsubscribeFromTable("subjects")
    }
  }, [])

  const fetchSubjects = async () => {
    try {
      const { subjects: data } = await apiClient.getSubjects()
      setSubjects(data || [])
      setIsConnected(true)
    } catch (error) {
      console.error("Error fetching subjects:", error)
      setIsConnected(false)
      toast({
        title: "Error",
        description: "Failed to fetch subjects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealTimeSubscription = () => {
    realTimeManager.subscribeToSubjectChanges((payload) => {
      console.log("[v0] Real-time subject update:", payload)

      if (payload.eventType === "INSERT") {
        setSubjects((prev) => [...prev, payload.new])
        toast({
          title: "Subject Added",
          description: `${payload.new.name} has been added.`,
        })
      } else if (payload.eventType === "UPDATE") {
        setSubjects((prev) => prev.map((s) => (s.id === payload.new.id ? payload.new : s)))
        toast({
          title: "Subject Updated",
          description: `${payload.new.name} has been updated.`,
        })
      } else if (payload.eventType === "DELETE") {
        setSubjects((prev) => prev.filter((s) => s.id !== payload.old.id))
        toast({
          title: "Subject Deleted",
          description: `Subject has been removed.`,
        })
      }
    })
    setIsConnected(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSubject) {
        await apiClient.updateSubject(editingSubject.id, formData)
      } else {
        await apiClient.createSubject(formData)
      }

      setIsDialogOpen(false)
      setEditingSubject(null)
      setFormData({ name: "", code: "", department: "", credits: 3 })

      toast({
        title: "Success",
        description: `Subject ${editingSubject ? "updated" : "created"} successfully.`,
      })
    } catch (error) {
      console.error("Error saving subject:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingSubject ? "update" : "create"} subject.`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (subject) => {
    setEditingSubject(subject)
    setFormData(subject)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      try {
        await apiClient.deleteSubject(id)
        toast({
          title: "Success",
          description: "Subject deleted successfully.",
        })
      } catch (error) {
        console.error("Error deleting subject:", error)
        toast({
          title: "Error",
          description: "Failed to delete subject.",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading subjects...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Subjects</h1>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" title="Real-time connected" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" title="Real-time disconnected" />
            )}
          </div>
          <p className="text-muted-foreground">Manage course subjects and their details</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              <DialogDescription>
                {editingSubject ? "Update the subject details" : "Create a new subject for your institution"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Introduction to Computer Science"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="CS101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Computer Science"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: Number.parseInt(e.target.value) })}
                  min="1"
                  max="6"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingSubject ? "Update Subject" : "Add Subject"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingSubject(null)
                    setFormData({ name: "", code: "", department: "", credits: 3 })
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
        {subjects.map((subject) => (
          <Card key={subject.id} className="border-border bg-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription>{subject.code}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(subject)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(subject.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Department:</span>
                  <Badge variant="secondary">{subject.department}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Credits:</span>
                  <Badge variant="outline">{subject.credits}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {subjects.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No subjects found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first subject</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
