
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAdminByEmail, getFirstAdminEmail } from '@/lib/admin';
import { getPublishedSchedule } from '@/lib/schedule';
import { AppLogo } from '@/components/common/app-logo';
import { ScheduleViewer } from '@/components/admin/schedule-viewer';
import { getSubjects } from '@/lib/subjects';
import { getFaculty } from '@/lib/faculty';
import { getAllRooms } from '@/lib/buildings';

export default async function SchedulePage({ searchParams }: { searchParams: { email?: string } }) {
  const loggedInAdminEmail = searchParams.email;
  if (!loggedInAdminEmail) {
    notFound();
  }
  
  const loggedInAdmin = await getAdminByEmail(loggedInAdminEmail);
  const primaryAdminEmail = await getFirstAdminEmail();

  if (!primaryAdminEmail) {
    notFound();
  }

  const publishedSchedule = await getPublishedSchedule(primaryAdminEmail);
  const allSubjects = await getSubjects(primaryAdminEmail);
  const allFaculty = await getFaculty(primaryAdminEmail);
  const allRooms = await getAllRooms(primaryAdminEmail);

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
            <ScheduleViewer 
                schedule={publishedSchedule} 
                adminEmail={primaryAdminEmail}
                loggedInAdminEmail={loggedInAdminEmail}
                allSubjects={allSubjects}
                allFaculty={allFaculty}
                allRooms={allRooms}
            />
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
