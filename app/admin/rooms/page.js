"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, MapPin, Users, Monitor, Wifi, WifiOff, Building } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { realTimeManager } from "@/lib/real-time"
import { useToast } from "@/hooks/use-toast"

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    capacity: 30,
    type: "classroom",
    equipment: [],
    building: "",
    floor: "",
    description: "",
  })

  const { toast } = useToast()

  const roomTypes = [
    { value: "classroom", label: "Classroom", icon: Building },
    { value: "lab", label: "Laboratory", icon: Monitor },
    { value: "auditorium", label: "Auditorium", icon: Users },
    { value: "seminar", label: "Seminar Room", icon: MapPin },
  ]

  const availableEquipment = [
    "projector",
    "whiteboard",
    "smartboard",
    "computers",
    "sound_system",
    "microphone",
    "air_conditioning",
    "wifi",
    "video_conferencing",
    "laboratory_equipment",
    "microscopes",
    "3d_printer",
  ]

  useEffect(() => {
    fetchRooms()
    setupRealTimeSubscription()

    return () => {
      realTimeManager.unsubscribeFromTable("rooms")
    }
  }, [])

  const fetchRooms = async () => {
    try {
      const { rooms: data } = await apiClient.getRooms()
      setRooms(data || [])
      setIsConnected(true)
    } catch (error) {
      console.error("Error fetching rooms:", error)
      setIsConnected(false)
      toast({
        title: "Error",
        description: "Failed to fetch rooms. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealTimeSubscription = () => {
    realTimeManager.subscribeToRoomChanges((payload) => {
      console.log("[v0] Real-time room update:", payload)

      if (payload.eventType === "INSERT") {
        setRooms((prev) => [...prev, payload.new])
        toast({
          title: "Room Added",
          description: `${payload.new.name} has been added.`,
        })
      } else if (payload.eventType === "UPDATE") {
        setRooms((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)))
        toast({
          title: "Room Updated",
          description: `${payload.new.name} has been updated.`,
        })
      } else if (payload.eventType === "DELETE") {
        setRooms((prev) => prev.filter((r) => r.id !== payload.old.id))
        toast({
          title: "Room Deleted",
          description: `Room has been removed.`,
        })
      }
    })
    setIsConnected(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRoom) {
        await apiClient.updateRoom(editingRoom.id, formData)
      } else {
        await apiClient.createRoom(formData)
      }

      setIsDialogOpen(false)
      setEditingRoom(null)
      resetForm()

      toast({
        title: "Success",
        description: `Room ${editingRoom ? "updated" : "created"} successfully.`,
      })
    } catch (error) {
      console.error("Error saving room:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingRoom ? "update" : "create"} room.`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name || "",
      capacity: room.capacity || 30,
      type: room.type || "classroom",
      equipment: room.equipment || [],
      building: room.building || "",
      floor: room.floor || "",
      description: room.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this room?")) {
      try {
        await apiClient.deleteRoom(id)
        toast({
          title: "Success",
          description: "Room deleted successfully.",
        })
      } catch (error) {
        console.error("Error deleting room:", error)
        toast({
          title: "Error",
          description: "Failed to delete room.",
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      capacity: 30,
      type: "classroom",
      equipment: [],
      building: "",
      floor: "",
      description: "",
    })
  }

  const handleEquipmentChange = (equipment, checked) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        equipment: [...prev.equipment, equipment],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        equipment: prev.equipment.filter((e) => e !== equipment),
      }))
    }
  }

  const getRoomTypeIcon = (type) => {
    const roomType = roomTypes.find((rt) => rt.value === type)
    return roomType ? roomType.icon : Building
  }

  const getRoomTypeLabel = (type) => {
    const roomType = roomTypes.find((rt) => rt.value === type)
    return roomType ? roomType.label : type
  }

  const getCapacityColor = (capacity) => {
    if (capacity >= 100) return "bg-blue-500"
    if (capacity >= 50) return "bg-green-500"
    if (capacity >= 25) return "bg-yellow-500"
    return "bg-orange-500"
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading rooms...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" title="Real-time connected" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" title="Real-time disconnected" />
            )}
          </div>
          <p className="text-muted-foreground">Manage rooms, capacity, and equipment</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
              <DialogDescription>
                {editingRoom ? "Update the room information" : "Create a new room for your institution"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Room A101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
                    min="1"
                    max="500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Room Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Input
                    id="building"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    placeholder="Building A"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="1st Floor"
                />
              </div>

              <div className="space-y-2">
                <Label>Equipment</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {availableEquipment.map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={formData.equipment.includes(equipment)}
                        onCheckedChange={(checked) => handleEquipmentChange(equipment, checked)}
                      />
                      <Label htmlFor={equipment} className="text-sm capitalize">
                        {equipment.replace("_", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional room details..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingRoom ? "Update Room" : "Add Room"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingRoom(null)
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

      {/* Room Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{rooms.length}</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">{rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Classrooms</p>
                <p className="text-2xl font-bold">{rooms.filter((r) => r.type === "classroom").length}</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Laboratories</p>
                <p className="text-2xl font-bold">{rooms.filter((r) => r.type === "lab").length}</p>
              </div>
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const RoomIcon = getRoomTypeIcon(room.type)
          return (
            <Card key={room.id} className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <RoomIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline">{getRoomTypeLabel(room.type)}</Badge>
                        {room.building && <span className="text-xs">• {room.building}</span>}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(room)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(room.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capacity:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getCapacityColor(room.capacity)}`} />
                    <Badge variant="secondary">{room.capacity} seats</Badge>
                  </div>
                </div>

                {room.floor && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Floor:</span>
                    <Badge variant="outline">{room.floor}</Badge>
                  </div>
                )}

                {room.equipment && room.equipment.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Equipment:</span>
                    <div className="flex flex-wrap gap-1">
                      {room.equipment.slice(0, 3).map((equipment) => (
                        <Badge key={equipment} variant="secondary" className="text-xs">
                          {equipment.replace("_", " ")}
                        </Badge>
                      ))}
                      {room.equipment.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{room.equipment.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {room.description && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {rooms.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No rooms found</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first room</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
