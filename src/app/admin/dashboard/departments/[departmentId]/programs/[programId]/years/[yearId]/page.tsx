
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, LogOut, ChevronLeft, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getDepartmentById, getProgramById } from '@/lib/departments';
import { AddSectionDialog } from '@/components/admin/departments/programs/years/sections/add-section-dialog';
import { EditYearDialog } from '@/components/admin/departments/programs/years/edit-year-dialog';
import { DeleteYearDialog } from '@/components/admin/departments/programs/years/delete-year-dialog';
import { SectionsList } from '@/components/admin/departments/programs/years/sections/sections-list';

export default async function YearSectionsPage({ params, searchParams }: { params: { departmentId: string, programId: string, yearId: string }, searchParams: { email?: string } }) {
  const admin = searchParams.email ? await getAdminByEmail(searchParams.email) : null;
  const department = await getDepartmentById(params.departmentId);
  const program = await getProgramById(params.departmentId, params.programId);
  const year = program?.years.find(y => y.id === params.yearId);

  if (!department || !program || !year) {
    notFound();
  }

  const redirectPath = `/admin/dashboard/departments/${department.id}/programs/${program.id}?email=${searchParams.email}`;

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
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/dashboard/departments/${department.id}/programs/${program.id}?email=${searchParams.email}`}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Back to Years</span>
                        </Link>
                      </Button>
                      <div className="grid gap-1">
                        <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-6 w-6" /> {year.name}</CardTitle>
                        <CardDescription>Manage sections for {program.name} - {year.name}.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <AddSectionDialog departmentId={department.id} programId={program.id} yearId={year.id} />
                        <EditYearDialog departmentId={department.id} programId={program.id} year={year} variant="button" />
                        <DeleteYearDialog departmentId={department.id} programId={program.id} year={year} variant="button" onSuccessRedirect={redirectPath} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <SectionsList departmentId={department.id} programId={program.id} yearId={year.id} sections={year.sections || []} />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
