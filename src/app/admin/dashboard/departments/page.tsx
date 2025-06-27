import Link from 'next/link';
import { CalendarDays, LogOut, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';

export default async function DepartmentsPage({ searchParams }: { searchParams: { email?: string } }) {
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
        <div className="mx-auto grid w-full max-w-6xl gap-6 pt-8">
            <Card>
                <CardHeader>
                   <div className="flex items-start gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/admin/dashboard?email=${searchParams.email}`}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Dashboard</span>
                      </Link>
                    </Button>
                    <div className="grid gap-1">
                      <CardTitle>Manage Departments</CardTitle>
                      <CardDescription>Add, edit, and remove academic departments.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <p>Department management functionality will be here.</p>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
