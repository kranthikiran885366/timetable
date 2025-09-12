// Real-time functionality using Supabase subscriptions
import { createClient } from "@/lib/supabase/client"

export class RealTimeManager {
  constructor() {
    this.supabase = createClient()
    this.subscriptions = new Map()
  }

  // Subscribe to table changes
  subscribeToTable(table, callback, filter = null) {
    const subscriptionKey = `${table}_${filter || "all"}`

    if (this.subscriptions.has(subscriptionKey)) {
      return this.subscriptions.get(subscriptionKey)
    }

    const subscription = this.supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          ...(filter && { filter }),
        },
        callback,
      )
      .subscribe()

    this.subscriptions.set(subscriptionKey, subscription)
    return subscription
  }

  // Subscribe to timetable changes
  subscribeToTimetableChanges(callback) {
    return this.subscribeToTable("classes", (payload) => {
      console.log("[v0] Timetable change detected:", payload)
      callback(payload)
    })
  }

  // Subscribe to subject changes
  subscribeToSubjectChanges(callback) {
    return this.subscribeToTable("subjects", (payload) => {
      console.log("[v0] Subject change detected:", payload)
      callback(payload)
    })
  }

  // Subscribe to faculty changes
  subscribeToFacultyChanges(callback) {
    return this.subscribeToTable(
      "profiles",
      (payload) => {
        if (payload.new?.role === "faculty" || payload.old?.role === "faculty") {
          console.log("[v0] Faculty change detected:", payload)
          callback(payload)
        }
      },
      "role=eq.faculty",
    )
  }

  // Subscribe to room changes
  subscribeToRoomChanges(callback) {
    return this.subscribeToTable("rooms", (payload) => {
      console.log("[v0] Room change detected:", payload)
      callback(payload)
    })
  }

  // Unsubscribe from specific table
  unsubscribeFromTable(table, filter = null) {
    const subscriptionKey = `${table}_${filter || "all"}`
    const subscription = this.subscriptions.get(subscriptionKey)

    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }
  }

  // Unsubscribe from all
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
  }

  // Broadcast custom events
  async broadcastEvent(channel, event, payload) {
    return this.supabase.channel(channel).send({
      type: "broadcast",
      event: event,
      payload: payload,
    })
  }

  // Listen to custom events
  subscribeToCustomEvents(channel, event, callback) {
    return this.supabase.channel(channel).on("broadcast", { event }, callback).subscribe()
  }
}

export const realTimeManager = new RealTimeManager()
