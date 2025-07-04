
import Link from 'next/link';
import {
  CalendarDays,
  Shield,
} from 'lucide-react';
import { getFacultyByEmail } from '@/lib/faculty';
import { notFound } from 'next/navigation';
import { getAdminByEmail } from '@/lib/admin';
import { TeacherDashboardClient } from '@/components/teacher/teacher-dashboard-client';
import { getAllRooms } from '@/lib/buildings';
import { getPublishedSchedule } from '@/lib/schedule';
import { getFacultyRoomRequests } from '@/lib/requests';
import { LogoutButton } from '@/components/auth/logout-button';

export default async function TeacherDashboardPage({ searchParams }: { searchParams: { email?: string; adminEmail?: string } }) {
  const facultyEmail = searchParams.email;
  const adminEmail = searchParams.adminEmail;

  if (!facultyEmail || !adminEmail) {
      notFound();
  }

  const faculty = await getFacultyByEmail(adminEmail, facultyEmail);
  const admin = await getAdminByEmail(adminEmail);
  const allRooms = await getAllRooms(adminEmail);
  const publishedSchedule = await getPublishedSchedule(adminEmail);
  const myRequests = await getFacultyRoomRequests(adminEmail, facultyEmail);
  
  if (!faculty) {
      notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">
              EduScheduler <span className="text-sm font-normal text-muted-foreground">by MintFire</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="font-medium text-foreground">{faculty.name}</p>
                <p className="text-xs text-muted-foreground">{admin?.name || 'Institution'}</p>
            </div>
            <LogoutButton
                adminEmail={adminEmail}
                facultyEmail={faculty.email}
                facultyName={faculty.name}
            />
          </div>
      </header>
      <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <TeacherDashboardClient 
            faculty={faculty} 
            admin={admin} 
            adminEmail={adminEmail} 
            allRooms={allRooms} 
            schedule={publishedSchedule}
            initialRequests={myRequests}
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
