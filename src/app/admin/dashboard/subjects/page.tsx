
import Link from 'next/link';
import { LogOut, ChevronLeft, BookOpen, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getSubjects } from '@/lib/subjects';
import { CreateSubjectDialog } from '@/components/admin/subjects/create-subject-dialog';
import { notFound } from 'next/navigation';
import { getDepartments } from '@/lib/departments';
import { getFaculty } from '@/lib/faculty';
import { SubjectsList } from '@/components/admin/subjects/subjects-list';
import { AppLogo } from '@/components/common/app-logo';

export default async function SubjectsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const adminEmail = searchParams.email as string;
  if (!adminEmail) {
    notFound();
  }

  const admin = await getAdminByEmail(adminEmail);
  const subjects = await getSubjects(adminEmail);
  const departments = await getDepartments(adminEmail);
  const facultyList = await getFaculty(adminEmail);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <AppLogo linkTo={`/admin/dashboard?email=${adminEmail}`} />
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
                    <SubjectsList 
                        initialSubjects={subjects} 
                        departments={departments} 
                        faculty={facultyList} 
                        adminEmail={adminEmail} 
                    />
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
