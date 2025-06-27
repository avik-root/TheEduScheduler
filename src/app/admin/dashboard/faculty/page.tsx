import Link from 'next/link';
import { CalendarDays, LogOut, ChevronLeft, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getFaculty, type Faculty } from '@/lib/faculty';
import { CreateFacultyDialog } from '@/components/admin/faculty/create-faculty-dialog';
import { EditFacultyDialog } from '@/components/admin/faculty/edit-faculty-dialog';
import { DeleteFacultyDialog } from '@/components/admin/faculty/delete-faculty-dialog';

export default async function FacultyPage({ searchParams }: { searchParams: { email?: string } }) {
  const admin = searchParams.email ? await getAdminByEmail(searchParams.email) : null;
  const facultyList = await getFaculty();

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
                        <Link href={`/admin/dashboard?email=${searchParams.email}`}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Back to Dashboard</span>
                        </Link>
                      </Button>
                      <div className="grid gap-1">
                        <CardTitle>Manage Faculty</CardTitle>
                        <CardDescription>Add, edit, and remove faculty members.</CardDescription>
                      </div>
                    </div>
                    <CreateFacultyDialog />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {facultyList.map((faculty: Faculty) => (
                      <Card key={faculty.email}>
                        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                          <div className="flex items-center gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                              <UserCog className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">{faculty.name}</CardTitle>
                              <CardDescription>{faculty.email}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <EditFacultyDialog faculty={faculty} />
                            <DeleteFacultyDialog faculty={faculty} />
                          </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Department: <span className="font-medium text-foreground">{faculty.department}</span>
                            </p>
                        </CardContent>
                      </Card>
                    ))}
                    {facultyList.length === 0 && (
                      <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                        <div className="text-center">
                          <p className="text-muted-foreground">
                            No faculty accounts found.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click &apos;Create New Faculty&apos; to get started.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
