
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, LogOut, ChevronLeft, BookCopy, Calendar as CalendarIcon, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getDepartmentById, getProgramById, type Year } from '@/lib/departments';
import { EditProgramDialog } from '@/components/admin/departments/programs/edit-program-dialog';
import { DeleteProgramDialog } from '@/components/admin/departments/programs/delete-program-dialog';
import { CreateYearDialog } from '@/components/admin/departments/programs/years/create-year-dialog';
import { EditYearDialog } from '@/components/admin/departments/programs/years/edit-year-dialog';
import { DeleteYearDialog } from '@/components/admin/departments/programs/years/delete-year-dialog';
import { TypingAnimation } from '@/components/common/typing-animation';


export default async function ProgramYearsPage({ params, searchParams }: { params: { departmentId: string, programId: string }, searchParams: { email?: string } }) {
  const adminEmail = searchParams.email;
  if (!adminEmail) {
    notFound();
  }

  const admin = await getAdminByEmail(adminEmail);
  const department = await getDepartmentById(adminEmail, params.departmentId);
  const program = await getProgramById(adminEmail, params.departmentId, params.programId);

  if (!department || !program) {
    notFound();
  }

  const redirectPath = `/admin/dashboard/departments/${department.id}?email=${adminEmail}`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">
              EduScheduler <TypingAnimation text="by MintFire" className="text-sm font-normal text-muted-foreground" />
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
                        <Link href={`/admin/dashboard/departments/${department.id}?email=${adminEmail}`}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Back to Programs</span>
                        </Link>
                      </Button>
                      <div className="grid gap-1">
                        <CardTitle className="flex items-center gap-2"><BookCopy className="h-6 w-6" /> {program.name}</CardTitle>
                        <CardDescription>Manage academic years for this program.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <CreateYearDialog departmentId={department.id} programId={program.id} adminEmail={adminEmail} />
                        <EditProgramDialog departmentId={department.id} program={program} adminEmail={adminEmail} variant="button" />
                        <DeleteProgramDialog departmentId={department.id} program={program} adminEmail={adminEmail} variant="button" onSuccessRedirect={redirectPath} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(program.years || []).map((year: Year) => (
                      <Card key={year.id} className="h-full flex flex-col">
                        <CardHeader className="flex-row items-center justify-between gap-4">
                          <Link href={`/admin/dashboard/departments/${department.id}/programs/${program.id}/years/${year.id}?email=${adminEmail}`} className="flex-grow">
                            <div className="flex items-center gap-4">
                                <div className="rounded-full bg-primary/10 p-3">
                                  <CalendarIcon className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-xl">{year.name}</CardTitle>
                            </div>
                          </Link>
                          <div className="flex items-center gap-1">
                              <EditYearDialog departmentId={department.id} programId={program.id} year={year} adminEmail={adminEmail} />
                              <DeleteYearDialog departmentId={department.id} programId={program.id} year={year} adminEmail={adminEmail} />
                          </div>
                        </CardHeader>
                         <CardContent className="flex-grow">
                          <Link href={`/admin/dashboard/departments/${department.id}/programs/${program.id}/years/${year.id}?email=${adminEmail}`} className="block">
                              <p className="text-sm text-muted-foreground">
                                  {(year.sections || []).length} section(s)
                              </p>
                          </Link>
                        </CardContent>
                        <CardFooter>
                          <Link href={`/admin/dashboard/departments/${department.id}/programs/${program.id}/years/${year.id}?email=${adminEmail}`} className="block w-full">
                            <p className="text-xs text-muted-foreground">Click to manage sections</p>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                    {(program.years || []).length === 0 && (
                      <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                        <div className="text-center">
                           <p className="text-muted-foreground">
                            No years found for this program.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click &apos;Create New Year(s)&apos; to get started.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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
