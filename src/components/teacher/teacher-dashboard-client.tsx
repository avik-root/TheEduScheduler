'use client';

import * as React from 'react';
import { User, Clock, CalendarOff, Building, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Faculty } from '@/lib/faculty';
import type { Admin } from '@/lib/admin';
import { ChangePasswordDialog } from '@/components/teacher/change-password-dialog';

interface TeacherDashboardClientProps {
    faculty: Faculty;
    admin: Admin | null;
    adminEmail: string;
}

export function TeacherDashboardClient({ faculty, admin, adminEmail }: TeacherDashboardClientProps) {
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
           <div className="pt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>My Weekly Schedule</CardTitle>
                        <CardDescription>Your class schedule for the upcoming week.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="rounded-lg border bg-muted p-4 text-center">
                            <p className="text-muted-foreground">Your generated schedule will appear here once it is published by the admin.</p>
                        </div>
                    </CardContent>
                </Card>
           </div>
        </div>
  );
}
