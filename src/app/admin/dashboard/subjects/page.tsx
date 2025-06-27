
import Link from 'next/link';
import { CalendarDays, LogOut, ChevronLeft, BookOpen, User, Network, BookCopy, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getSubjects, type Subject } from '@/lib/subjects';
import { CreateSubjectDialog } from '@/components/admin/subjects/create-subject-dialog';
import { EditSubjectDialog } from '@/components/admin/subjects/edit-subject-dialog';
import { DeleteSubjectDialog } from '@/components/admin/subjects/delete-subject-dialog';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getDepartments } from '@/lib/departments';
import { getFaculty } from '@/lib/faculty';

export default async function SubjectsPage({ searchParams }: { searchParams: { email?: string } }) {
  const adminEmail = searchParams.email;
  if (!adminEmail) {
    notFound();
  }

  const admin = await getAdminByEmail(adminEmail);
  const subjects = await getSubjects(adminEmail);
  const departments = await getDepartments(adminEmail);
  const facultyList = await getFaculty(adminEmail);

  const getSubjectDetails = (subject: Subject) => {
    const department = departments.find(d => d.id === subject.departmentId);
    if (!department) return { departmentName: 'N/A', programName: 'N/A', yearName: 'N/A', facultyName: 'N/A' };

    const program = department.programs.find(p => p.id === subject.programId);
    const year = program?.years.find(y => y.id === subject.yearId);
    const facultyMember = facultyList.find(f => f.email === subject.facultyEmail);

    return {
        departmentName: department.name,
        programName: program?.name || 'N/A',
        yearName: year?.name || 'N/A',
        facultyName: facultyMember?.name || 'N/A'
    };
  };

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
                            <Link href={`/admin/dashboard?email=${adminEmail}`}>
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Back to Dashboard</span>
                            </Link>
                            </Button>
                            <div className="grid gap-1">
                                <CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6" /> Manage Subjects</CardTitle>
                                <CardDescription>Add, edit, and remove subjects or courses.</CardDescription>
                            </div>
                        </div>
                        <CreateSubjectDialog adminEmail={adminEmail} departments={departments} faculty={facultyList} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {subjects.map((subject: Subject) => {
                          const details = getSubjectDetails(subject);
                          return (
                           <Card key={subject.id} className="flex flex-col">
                                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                                    <div className="flex-grow">
                                        <CardTitle className="text-xl">{subject.name}</CardTitle>
                                        <CardDescription>{subject.code}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <EditSubjectDialog subject={subject} adminEmail={adminEmail} departments={departments} faculty={facultyList} />
                                        <DeleteSubjectDialog subject={subject} adminEmail={adminEmail} />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3">
                                    <Badge variant={subject.type === 'Theory' ? 'default' : subject.type === 'Practical' ? 'secondary' : 'outline'}>
                                        {subject.type}
                                    </Badge>
                                    <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <Network className="h-4 w-4 shrink-0" />
                                        <span>{details.departmentName}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <BookCopy className="h-4 w-4 shrink-0" />
                                        <span>{details.programName}</span>
                                      </div>
                                       <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 shrink-0" />
                                        <span>{details.yearName}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 shrink-0" />
                                        <span>{details.facultyName}</span>
                                      </div>
                                    </div>
                                </CardContent>
                           </Card>
                          )
                        })}
                        {subjects.length === 0 && (
                            <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                                <div className="text-center">
                                    <p className="text-muted-foreground">
                                        No subjects found.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Click &apos;Create New Subject&apos; to get started.
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
