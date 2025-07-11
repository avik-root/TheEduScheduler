
import Link from 'next/link';
import {
  LogOut,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAdminByEmail, getFirstAdminEmail } from '@/lib/admin';
import { getAllRooms } from '@/lib/buildings';
import { notFound } from 'next/navigation';
import { DashboardClient } from '@/components/admin/dashboard-client';
import { getRoomRequests } from '@/lib/requests';
import { AppLogo } from '@/components/common/app-logo';
import { getDepartments } from '@/lib/departments';
import { getFaculty } from '@/lib/faculty';
import { getSubjects } from '@/lib/subjects';
import { getPublishedSchedule } from '@/lib/schedule';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default async function AdminDashboardPage({ searchParams }: { searchParams: { email?: string } }) {
  const loggedInAdminEmail = searchParams.email;
  if (!loggedInAdminEmail) {
    notFound();
  }
  
  const loggedInAdmin = await getAdminByEmail(loggedInAdminEmail);
  const primaryAdminEmail = await getFirstAdminEmail();

  if (!primaryAdminEmail) {
    // This case happens if there are no admins, e.g., on first setup.
    // The dashboard won't have any data to show anyway.
    notFound();
  }

  const allRooms = await getAllRooms(primaryAdminEmail);
  const roomRequests = await getRoomRequests(primaryAdminEmail);
  const departments = await getDepartments(primaryAdminEmail);
  const faculty = await getFaculty(primaryAdminEmail);
  const subjects = await getSubjects(primaryAdminEmail);
  const publishedSchedule = await getPublishedSchedule(primaryAdminEmail);
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <AppLogo linkTo={`/admin/dashboard?email=${loggedInAdminEmail}`} />
          <div className="flex items-center gap-4">
            <ThemeToggle />
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
        <DashboardClient 
            admin={loggedInAdmin} 
            allRooms={allRooms} 
            adminEmail={primaryAdminEmail} 
            roomRequests={roomRequests} 
            departments={departments}
            faculty={faculty}
            subjects={subjects}
            publishedSchedule={publishedSchedule}
        />
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
