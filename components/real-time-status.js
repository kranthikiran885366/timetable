"use client"

import { useState, useEffect } from "react"
import { realTimeManager } from "@/lib/real-time"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Users } from "lucide-react"

export function RealTimeStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState(0)

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(realTimeManager.subscriptions.size > 0)
    }

    // Subscribe to presence updates
    const presenceChannel = realTimeManager.supabase
      .channel("online_users")
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        setActiveUsers(Object.keys(state).length)
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("[v0] User joined:", key, newPresences)
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("[v0] User left:", key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: Math.random().toString(36).substr(2, 9),
            online_at: new Date().toISOString(),
          })
        }
      })

    checkConnection()
    const interval = setInterval(checkConnection, 5000)

    return () => {
      clearInterval(interval)
      presenceChannel.unsubscribe()
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isConnected ? "Connected" : "Disconnected"}
      </Badge>
      {activeUsers > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {activeUsers} online
        </Badge>
      )}
    </div>
  )
}
