"use client"

import { useState, useEffect } from "react"
import { realTimeManager } from "@/lib/real-time"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, BookOpen, Users, MapPin } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Subscribe to various real-time events
    const subscriptions = [
      realTimeManager.subscribeToTimetableChanges(handleTimetableChange),
      realTimeManager.subscribeToSubjectChanges(handleSubjectChange),
      realTimeManager.subscribeToFacultyChanges(handleFacultyChange),
      realTimeManager.subscribeToRoomChanges(handleRoomChange),
    ]

    // Subscribe to custom broadcast events
    realTimeManager.subscribeToCustomEvents("timetable_updates", "timetable_saved", handleTimetableSaved)

    return () => {
      subscriptions.forEach((sub) => sub?.unsubscribe())
    }
  }, [])

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification,
    }

    setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]) // Keep last 10
    setUnreadCount((prev) => prev + 1)
  }

  const handleTimetableChange = (payload) => {
    addNotification({
      type: "timetable",
      icon: Calendar,
      title: "Timetable Updated",
      message: `A class schedule has been ${payload.eventType.toLowerCase()}d`,
      color: "blue",
    })
  }

  const handleSubjectChange = (payload) => {
    addNotification({
      type: "subject",
      icon: BookOpen,
      title: "Subject Modified",
      message: `Subject "${payload.new?.name || payload.old?.name}" was ${payload.eventType.toLowerCase()}d`,
      color: "green",
    })
  }

  const handleFacultyChange = (payload) => {
    addNotification({
      type: "faculty",
      icon: Users,
      title: "Faculty Updated",
      message: `Faculty member "${payload.new?.full_name || payload.old?.full_name}" was ${payload.eventType.toLowerCase()}d`,
      color: "purple",
    })
  }

  const handleRoomChange = (payload) => {
    addNotification({
      type: "room",
      icon: MapPin,
      title: "Room Modified",
      message: `Room "${payload.new?.name || payload.old?.name}" was ${payload.eventType.toLowerCase()}d`,
      color: "orange",
    })
  }

  const handleTimetableSaved = (payload) => {
    addNotification({
      type: "timetable",
      icon: Calendar,
      title: "Timetable Saved",
      message: `${payload.payload.classes_count} classes saved for ${payload.payload.semester}`,
      color: "blue",
    })
  }

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">{unreadCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notifications yet</p>
            ) : (
              notifications.map((notification) => {
                const Icon = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read ? "bg-muted/30" : "bg-background"
                    } cursor-pointer hover:bg-muted/50 transition-colors`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-4 w-4 mt-0.5 text-${notification.color}-500`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp.toLocaleTimeString()}</p>
                      </div>
                      {!notification.read && <div className="w-2 h-2 bg-primary rounded-full mt-2" />}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
