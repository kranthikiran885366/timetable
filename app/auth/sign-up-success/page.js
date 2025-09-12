import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, Mail, CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
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
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Account Created Successfully!</CardTitle>
              <CardDescription>Please check your email to verify your account</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <Mail className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  We've sent a verification email to your inbox. Please click the link in the email to activate your
                  account and complete the registration process.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Didn't receive the email? Check your spam folder.</p>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full bg-transparent">
                    Back to Login
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
