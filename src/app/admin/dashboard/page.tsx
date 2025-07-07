
import Link from 'next/link';
import {
  LogOut,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAdminByEmail } from '@/lib/admin';
import { getAllRooms } from '@/lib/buildings';
import { notFound } from 'next/navigation';
import { DashboardClient } from '@/components/admin/dashboard-client';
import { getRoomRequests } from '@/lib/requests';
import { AppLogo } from '@/components/common/app-logo';
import { getDepartments } from '@/lib/departments';
import { getFaculty } from '@/lib/faculty';
import { getSubjects } from '@/lib/subjects';
import { getPublishedSchedule } from '@/lib/schedule';

export default async function AdminDashboardPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const adminEmail = searchParams.email as string;
  if (!adminEmail) {
    notFound();
  }
  
  const admin = await getAdminByEmail(adminEmail);
  const allRooms = await getAllRooms(adminEmail);
  const roomRequests = await getRoomRequests(adminEmail);
  const departments = await getDepartments(adminEmail);
  const faculty = await getFaculty(adminEmail);
  const subjects = await getSubjects(adminEmail);
  const publishedSchedule = await getPublishedSchedule(adminEmail);
  
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
        <DashboardClient 
            admin={admin} 
            allRooms={allRooms} 
            adminEmail={adminEmail} 
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
