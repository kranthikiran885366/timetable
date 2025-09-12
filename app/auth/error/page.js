import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, AlertCircle } from "lucide-react"

export default async function AuthErrorPage({ searchParams }) {
  const params = await searchParams
  const error = params?.error

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">TimetableGen</span>
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive-foreground">
                  {error ? `Error: ${error}` : "An authentication error occurred. Please try again."}
                </p>
              </div>
              <div className="space-y-2">
                <Link href="/auth/login">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Try Again</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full bg-transparent">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
