
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Network,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { Admin } from '@/lib/admin';
import type { GenerateScheduleOutput } from '@/ai/flows/generate-schedule';
import { AiScheduleGenerator } from '@/components/admin/ai-schedule-generator';
import { RoomAvailabilityChecker } from '@/components/admin/room-availability-checker';
import { RoomRequests } from './room-requests';
import type { RoomRequest } from '@/lib/requests';
import { TwoFactorSettingsDialog } from './two-factor-settings-dialog';
import { differenceInDays } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { Department, Faculty, Subject, Room } from '@/lib/types';


interface DashboardClientProps {
    admin: Admin | null;
    allRooms: Room[];
    adminEmail: string;
    roomRequests: RoomRequest[];
    departments: Department[];
    faculty: Faculty[];
    subjects: Subject[];
    publishedSchedule: string;
}

export function DashboardClient({ admin, allRooms, adminEmail, roomRequests, departments, faculty, subjects, publishedSchedule }: DashboardClientProps) {
    const [generatedSchedule, setGeneratedSchedule] = React.useState<GenerateScheduleOutput | null>(null);
    const [passwordDaysOld, setPasswordDaysOld] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (admin?.passwordLastChanged) {
            const days = differenceInDays(new Date(), new Date(admin.passwordLastChanged));
            setPasswordDaysOld(days < 0 ? 0 : days);
        }
    }, [admin]);

    const passwordAlert = () => {
        if (passwordDaysOld === null || passwordDaysOld <= 180) return null;
        if (passwordDaysOld > 210) {
            const daysRemaining = 217 - passwordDaysOld;
            return (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Urgent: Password Change Required</AlertTitle>
                    <AlertDescription>
                        Your password is {passwordDaysOld} days old. To avoid account lockout, you must change it within {daysRemaining} day(s).
                    </AlertDescription>
                </Alert>
            )
        }
        return (
            <Alert className="mb-6">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Security Reminder: Change Your Password</AlertTitle>
                <AlertDescription>
                    Your password was last updated {passwordDaysOld} days ago. For security, we recommend changing it soon.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6">
            <div className="my-8">
                <h1 className="text-3xl font-semibold">Management Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome, {admin?.name}. Manage your institution's resources from here.
                </p>
            </div>
             {passwordAlert()}
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Link href={`/admin/dashboard/faculty?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Faculty</CardTitle>
                          <Users className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Add, edit, and view faculty members.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/buildings?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Buildings</CardTitle>
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Define campus buildings and rooms.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/departments?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Departments</CardTitle>
                          <Network className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Organize academic departments.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/subjects?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Subjects</CardTitle>
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Create and configure subjects/courses.</p>
                      </CardContent>
                  </Card>
              </Link>
               <Link href={`/admin/dashboard/schedule?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Published Schedule</CardTitle>
                          <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">View the active schedule and download as PDF.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/logs?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Recent Logs</CardTitle>
                          <ClipboardList className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">View recent faculty login activity.</p>
                      </CardContent>
                  </Card>
              </Link>
                {admin && (
                    <Card className="h-full flex flex-col">
                         <CardHeader className="flex-grow pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">Security</CardTitle>
                                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TwoFactorSettingsDialog admin={admin} />
                            {passwordDaysOld !== null && (
                                <p className="text-xs font-semibold text-muted-foreground pt-2">Password last changed {passwordDaysOld} day(s) ago.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
          </div>
            <div className="grid gap-6 pt-8">
                <RoomRequests initialRequests={roomRequests} adminEmail={adminEmail} />
                <AiScheduleGenerator
                    allRooms={allRooms}
                    generatedSchedule={generatedSchedule}
                    setGeneratedSchedule={setGeneratedSchedule}
                    adminEmail={adminEmail}
                    departments={departments}
                    faculty={faculty}
                    subjects={subjects}
                />
                <RoomAvailabilityChecker
                    userRole="admin"
                    allRooms={allRooms}
                    schedule={generatedSchedule?.schedule || publishedSchedule || ''}
                    adminEmail={adminEmail}
                />
            </div>
      </div>
    )
}
