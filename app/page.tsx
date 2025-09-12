import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Clock,
  Settings,
  Building,
  GraduationCap,
  Workflow,
  Zap,
  BarChart3,
  Shield,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">TimetableGen</span>
            </div>
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            AI-Powered Scheduling
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6 text-balance">
            Complete University Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Streamline your educational institution with intelligent timetable generation, comprehensive branch
            management, and automated conflict resolution.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Zap className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Complete Management Solution</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to manage your educational institution efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Branch Management */}
          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Branch Management
              </CardTitle>
              <CardDescription>
                Create and manage academic branches (CSE, ECE, etc.) with department heads and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Department head assignment</li>
                <li>• Semester configuration</li>
                <li>• Branch statistics</li>
                <li>• Real-time updates</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section Management */}
          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Section Management
              </CardTitle>
              <CardDescription>
                Organize students into sections with year, semester, and branch assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Year & semester tracking</li>
                <li>• Class teacher assignment</li>
                <li>• Student capacity management</li>
                <li>• Academic year organization</li>
              </ul>
            </CardContent>
          </Card>

          {/* Course Wizard */}
          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                Multi-step Course Wizard
              </CardTitle>
              <CardDescription>Intuitive 4-step process for course creation and timetable generation</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Visual progress tracking</li>
                <li>• Subject-faculty assignment</li>
                <li>• Resource allocation</li>
                <li>• Conflict detection</li>
              </ul>
            </CardContent>
          </Card>

          {/* AI Timetable Generation */}
          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                AI-Powered Scheduling
              </CardTitle>
              <CardDescription>
                Intelligent algorithms for optimal timetable creation with conflict resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-section support</li>
                <li>• Customizable timings</li>
                <li>• Automatic room allocation</li>
                <li>• Lunch break management</li>
              </ul>
            </CardContent>
          </Card>

          {/* Resource Management */}
          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Resource Management
              </CardTitle>
              <CardDescription>Comprehensive management of faculty, rooms, and subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Faculty specializations</li>
                <li>• Room capacity tracking</li>
                <li>• Subject categorization</li>
                <li>• Equipment management</li>
              </ul>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>Comprehensive insights and statistics for better decision making</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Utilization rates</li>
                <li>• Faculty workload analysis</li>
                <li>• Room occupancy stats</li>
                <li>• Performance metrics</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Configuration Options */}
      <section className="container mx-auto px-4 py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Flexible Configuration</h2>
          <p className="text-lg text-muted-foreground">Customize the system to match your institution's requirements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Time Management</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Customizable start/end times (9:00 AM - 4:00 PM default)
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                45-60 minute period duration
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Flexible break management (5-60 minutes)
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Monday-Saturday scheduling options
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">System Features</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Role-based access control
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Real-time collaboration
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Color-coded course types
              </li>
              <li className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Responsive design for all devices
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Transform Your Institution?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of educational institutions using TimetableGen for efficient scheduling and management.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Sign In to Continue
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">TimetableGen</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 TimetableGen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
