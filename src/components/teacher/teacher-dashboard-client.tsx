'use client';

import * as React from 'react';
import { User, Clock, CalendarOff, Settings, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Faculty } from '@/lib/faculty';
import type { Admin } from '@/lib/admin';
import type { Room } from '@/lib/buildings';
import { ChangePasswordDialog } from '@/components/teacher/change-password-dialog';
import { RoomAvailabilityChecker } from '../admin/room-availability-checker';
import type { RoomRequest } from '@/lib/requests';
import { MyRequestsList } from './my-requests-list';

interface TeacherDashboardClientProps {
    faculty: Faculty;
    admin: Admin | null;
    adminEmail: string;
    allRooms: Room[];
    schedule: string;
    initialRequests: RoomRequest[];
}

export function TeacherDashboardClient({ faculty, admin, adminEmail, allRooms, schedule, initialRequests }: TeacherDashboardClientProps) {

  const mySchedule = React.useMemo(() => {
    if (!schedule || !faculty.abbreviation) return '';
    const lines = schedule.split('\n');
    const header = lines[0];
    const separator = lines[1];
    const myLines = lines.slice(2).filter(line => line.includes(`(${faculty.abbreviation})`));
    
    if (myLines.length === 0) return '';
    
    return [header, separator, ...myLines].join('\n');
  }, [schedule, faculty.abbreviation]);

  return (
     <div className="mx-auto grid w-full max-w-6xl gap-6">
          <div className="my-8">
            <h1 className="text-3xl font-semibold">Faculty Dashboard</h1>
            <p className="text-muted-foreground">
                Welcome back, {faculty.name}. View your schedule and manage your availability.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription>Your personal and professional details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{faculty.name} ({faculty.email})</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{faculty.department}</span>
                    </div>
                </CardContent>
              </Card>
               <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>My Availability</CardTitle>
                    <CardDescription>Your configured scheduling constraints.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Max {faculty.weeklyMaxHours} hours / week</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <CalendarOff className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                            <span className="font-medium">Weekly Off Days</span>
                             {faculty.weeklyOffDays && faculty.weeklyOffDays.length > 0 ? (
                                <p className="text-sm text-muted-foreground">{faculty.weeklyOffDays.join(', ')}</p>
                             ) : (
                                <p className="text-sm text-muted-foreground">No off days specified.</p>
                             )}
                        </div>
                    </div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChangePasswordDialog facultyEmail={faculty.email} adminEmail={adminEmail} />
                </CardContent>
              </Card>
          </div>
          <div className="pt-8 grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Weekly Schedule</CardTitle>
                    <CardDescription>Your class schedule for the upcoming week. This is filtered to show only your classes.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="min-h-[200px] rounded-lg border bg-muted p-4 whitespace-pre-wrap">
                        {mySchedule ? (
                            <p>{mySchedule}</p>
                        ) : (
                            <div className="flex h-full items-center justify-center pt-16">
                                <p className="text-muted-foreground text-center">
                                    {schedule ? "You have no classes in the published schedule." : "Your schedule will appear here once it is published by the admin."}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            <RoomAvailabilityChecker
                userRole="faculty"
                allRooms={allRooms}
                schedule={schedule}
                adminEmail={adminEmail}
                facultyInfo={{ email: faculty.email, name: faculty.name }}
            />
            <MyRequestsList 
                initialRequests={initialRequests} 
                adminEmail={adminEmail} 
                facultyEmail={faculty.email}
            />
          </div>
        </div>
  );
}
