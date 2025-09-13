"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Calendar, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("Attempting login with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: 'https://timetable-eight-gamma.vercel.app/dashboard',
        },
      })
      if (error) throw error
      console.log("Login successful:", data);
      router.push("/dashboard")
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "An error occurred"
      let friendly = rawMessage
      const lower = rawMessage.toLowerCase()
      if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
        friendly = "Incorrect email or password."
      } else if (lower.includes("email not confirmed") || lower.includes("confirm your email") || lower.includes("not confirmed")) {
        friendly = "Please confirm your email before signing in. Check your inbox for the verification link."
      } else if (lower.includes("rate limit")) {
        friendly = "Too many attempts. Please wait a moment and try again."
      }
      setError(friendly)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">TimetableGen</span>
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@university.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                {error && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/sign-up" className="text-primary hover:text-primary/80 font-medium">
                  Create Account
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
