// API client for frontend-backend communication
class ApiClient {
  constructor() {
    this.baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.vercel.app"
        : "http://localhost:3000"
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api${endpoint}`
    const startTime = performance.now()

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body)
    }

    let lastError

    // Retry logic for failed requests
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config)
        const resClone = response.clone()

        // Parse body safely (handle empty, non-JSON, or already-read streams)
        let data = null
        const contentType = response.headers.get("content-type") || ""
        const noBody = response.status === 204 || response.status === 205 || config.method === "HEAD"

        if (!noBody) {
          try {
            if (contentType.includes("application/json")) {
              data = await response.json()
            } else {
              const text = await response.text()
              try {
                data = text ? JSON.parse(text) : null
              } catch {
                data = text
              }
            }
          } catch (e) {
            // Fallback if body stream was already read or invalid
            try {
              const text = await resClone.text()
              try {
                data = text ? JSON.parse(text) : null
              } catch {
                data = text
              }
            } catch {
              data = null
            }
          }
        }

        // Monitor API performance
        if (typeof window !== "undefined") {
          const duration = performance.now() - startTime
          console.log(`[API] ${endpoint}: ${duration.toFixed(2)}ms (attempt ${attempt})`)
        }

        if (!response.ok) {
          const message = (data && (data.error || data.message)) || response.statusText || "API request failed"
          const error = new Error(message)
          error.status = response.status
          error.endpoint = endpoint
          throw error
        }

        return data
      } catch (error) {
        lastError = error
        console.error(`[API] Attempt ${attempt} failed for ${endpoint}:`, error)

        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          break
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt))
        }
      }
    }

    // All attempts failed
    console.error(`[API] All ${this.retryAttempts} attempts failed for ${endpoint}`)
    throw lastError
  }

  // Subjects API
  async getSubjects() {
    return this.request("/subjects")
  }

  async createSubject(subject) {
    return this.request("/subjects", {
      method: "POST",
      body: subject,
    })
  }

  async updateSubject(id, subject) {
    return this.request(`/subjects/${id}`, {
      method: "PUT",
      body: subject,
    })
  }

  async deleteSubject(id) {
    return this.request(`/subjects/${id}`, {
      method: "DELETE",
    })
  }

  // Faculty API
  async getFaculty() {
    return this.request("/faculty")
  }

  async createFaculty(faculty) {
    return this.request("/faculty", {
      method: "POST",
      body: faculty,
    })
  }

  async updateFaculty(id, faculty) {
    return this.request(`/faculty/${id}`, {
      method: "PUT",
      body: faculty,
    })
  }

  async deleteFaculty(id) {
    return this.request(`/faculty/${id}`, {
      method: "DELETE",
    })
  }

  // Rooms API
  async getRooms() {
    return this.request("/rooms")
  }

  async createRoom(room) {
    return this.request("/rooms", {
      method: "POST",
      body: room,
    })
  }

  async updateRoom(id, room) {
    return this.request(`/rooms/${id}`, {
      method: "PUT",
      body: room,
    })
  }

  async deleteRoom(id) {
    return this.request(`/rooms/${id}`, {
      method: "DELETE",
    })
  }

  // Timetable API
  async generateTimetable(params) {
    return this.request("/timetable/generate", {
      method: "POST",
      body: params,
    })
  }

  async saveTimetable(data) {
    return this.request("/timetable/save", {
      method: "POST",
      body: data,
    })
  }

  // Dashboard API
  async getDashboardStats() {
    return this.request("/dashboard/stats")
  }
}

export const apiClient = new ApiClient()
