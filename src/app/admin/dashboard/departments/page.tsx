
import Link from 'next/link';
import { LogOut, ChevronLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail, getFirstAdminEmail } from '@/lib/admin';
import { getDepartments } from '@/lib/departments';
import { CreateDepartmentDialog } from '@/components/admin/departments/create-department-dialog';
import { notFound } from 'next/navigation';
import { DepartmentsList } from '@/components/admin/departments/departments-list';
import { AppLogo } from '@/components/common/app-logo';

export default async function DepartmentsPage({ searchParams }: { searchParams: { email?: string } }) {
  const loggedInAdminEmail = searchParams.email;
  if (!loggedInAdminEmail) {
    notFound();
  }

  const loggedInAdmin = await getAdminByEmail(loggedInAdminEmail);
  const primaryAdminEmail = await getFirstAdminEmail();

  if (!primaryAdminEmail) {
    notFound();
  }

  const departments = await getDepartments(primaryAdminEmail);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <AppLogo linkTo={`/admin/dashboard?email=${loggedInAdminEmail}`} />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
              {loggedInAdmin?.name || 'Admin'}
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
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/dashboard?email=${loggedInAdminEmail}`}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Back to Dashboard</span>
                        </Link>
                      </Button>
                      <div className="grid gap-1">
                        <CardTitle>Manage Departments</CardTitle>
                        <CardDescription>Add, edit, and remove academic departments and their programs.</CardDescription>
                      </div>
                    </div>
                    <CreateDepartmentDialog adminEmail={primaryAdminEmail} />
                  </div>
                </CardHeader>
                <CardContent>
                    <DepartmentsList initialDepartments={departments} adminEmail={primaryAdminEmail} loggedInAdminEmail={loggedInAdminEmail} />
                </CardContent>
            </Card>
        </div>
      </main>
       <footer className="mt-auto border-t bg-background px-4 py-4 md:px-6">
        <div className="container mx-auto flex items-center justify-center">
            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Shield className="h-4 w-4" />
                Secured by MintFire
            </p>
        </div>
      </footer>
    </div>
  );
}
