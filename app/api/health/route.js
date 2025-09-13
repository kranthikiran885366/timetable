import { createClient } from "@/lib/supabase/server"
export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connection
    const supabase = await createClient()
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      throw new Error(`Database check failed: ${error.message}`)
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: "connected",
        responseTime: `${responseTime}ms`,
      },
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("[Health Check] Failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
        environment: process.env.NODE_ENV,
      },
      { status: 503 },
    )
  }
}
