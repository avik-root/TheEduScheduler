import Link from 'next/link';
import {
  CalendarDays,
  LogOut,
  User,
  Clock,
  CalendarOff,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getFacultyByEmail } from '@/lib/faculty';
import { notFound } from 'next/navigation';

export default async function TeacherDashboardPage({ searchParams }: { searchParams: { email?: string } }) {
  const faculty = searchParams.email ? await getFacultyByEmail(searchParams.email) : null;
  
  if (!faculty) {
      notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">
              EduScheduler
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
              {faculty.name}
            </span>
            <Button variant="outline" size="icon" asChild>
              <Link href="/teacher/login">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Link>
            </Button>
          </div>
      </header>
      <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6">
          <div className="my-8">
            <h1 className="text-3xl font-semibold">Faculty Dashboard</h1>
            <p className="text-muted-foreground">
                Welcome back, {faculty.name}. View your schedule and manage your availability.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription>Your personal and professional details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{faculty.name} ({faculty.email})</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{faculty.department}</span>
                    </div>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                    <CardTitle>My Availability</CardTitle>
                    <CardDescription>Your configured scheduling constraints.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Max {faculty.weeklyMaxHours} hours / week</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <CalendarOff className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                            <span className="font-medium">Weekly Off Days</span>
                             {faculty.weeklyOffDays && faculty.weeklyOffDays.length > 0 ? (
                                <p className="text-sm text-muted-foreground">{faculty.weeklyOffDays.join(', ')}</p>
                             ) : (
                                <p className="text-sm text-muted-foreground">No off days specified.</p>
                             )}
                        </div>
                    </div>
                </CardContent>
              </Card>
          </div>
           <div className="pt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>My Weekly Schedule</CardTitle>
                        <CardDescription>Your class schedule for the upcoming week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="rounded-lg border bg-muted p-4 text-center">
                            <p className="text-muted-foreground">Your generated schedule will appear here once it is published by the admin.</p>
                        </div>
                    </CardContent>
                </Card>
           </div>
        </div>
      </main>
    </div>
  );
}
