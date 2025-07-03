import Link from 'next/link';
import {
  BrainCircuit,
  CalendarDays,
  LogOut,
  Users,
  Building2,
  Network,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { AiScheduleGenerator } from '@/components/admin/ai-schedule-generator';

export default async function AdminDashboardPage({ searchParams }: { searchParams: { email?: string } }) {
  const admin = searchParams.email ? await getAdminByEmail(searchParams.email) : null;
  
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
              {admin?.name || 'Admin'}
            </span>
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/login">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Link>
            </Button>
          </div>
      </header>
      <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6">
          <div className="my-8">
            <h1 className="text-3xl font-semibold">Management Dashboard</h1>
            <p className="text-muted-foreground">
                Welcome, {admin?.name}. Manage your institution's resources from here.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link href={`/admin/dashboard/faculty?email=${searchParams.email}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Faculty</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">Manage</div>
                          <p className="text-xs text-muted-foreground">Add, edit, and view faculty members.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/buildings?email=${searchParams.email}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Buildings</CardTitle>
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">Manage</div>
                          <p className="text-xs text-muted-foreground">Define campus buildings and rooms.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/departments?email=${searchParams.email}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Departments</CardTitle>
                          <Network className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">Manage</div>
                          <p className="text-xs text-muted-foreground">Organize academic departments.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/subjects?email=${searchParams.email}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">Manage</div>
                          <p className="text-xs text-muted-foreground">Create and configure subjects/courses.</p>
                      </CardContent>
                  </Card>
              </Link>
          </div>
          <div className="grid gap-6 pt-8">
            <AiScheduleGenerator />
          </div>
        </div>
      </main>
    </div>
  );
}
