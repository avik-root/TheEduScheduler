
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

interface SectionSchedule {
  sectionName: string;
  header: string[];
  rows: string[][];
}

function parseMultiSectionSchedule(markdown: string): SectionSchedule[] {
    if (!markdown || markdown.trim() === '') {
        return [];
    }
    const sections = markdown.trim().split(/###\s*(.*?)\s*\n/g).filter(Boolean);
    const parsedSchedules: SectionSchedule[] = [];
    for (let i = 0; i < sections.length; i += 2) {
        const sectionName = sections[i].trim().replace(/###\s*/, '');
        const tableMarkdown = sections[i + 1];
        if (!tableMarkdown || !tableMarkdown.includes('|')) continue;
        const lines = tableMarkdown.trim().split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) continue;
        const headerLine = lines[0];
        const separatorLine = lines[1];
        if (!headerLine.includes('|') || !separatorLine.includes('|--')) continue;
        const header = headerLine.split('|').map(h => h.trim()).filter(Boolean);
        const rows = lines.slice(2).map(line => 
            line.split('|').map(cell => cell.trim()).filter(Boolean)
        ).filter(row => row.length === header.length);
        if (header.length > 0 && rows.length > 0) {
            parsedSchedules.push({ sectionName, header, rows });
        }
    }
    return parsedSchedules;
}

export function TeacherDashboardClient({ faculty, admin, adminEmail, allRooms, schedule, initialRequests }: TeacherDashboardClientProps) {

  const mySchedule = React.useMemo(() => {
    if (!schedule || !faculty.abbreviation) return '';
    
    const allSectionSchedules = parseMultiSectionSchedule(schedule);
    const facultySchedules: SectionSchedule[] = [];
    const facultyAbbr = `(${faculty.abbreviation})`;

    allSectionSchedules.forEach(section => {
        const relevantRows = section.rows.filter(row => 
            row.some(cell => cell.includes(facultyAbbr))
        );

        if (relevantRows.length > 0) {
            facultySchedules.push({
                ...section,
                rows: relevantRows
            });
        }
    });
    
    if (facultySchedules.length === 0) return '';
    
    return facultySchedules.map(s => {
        const header = `| ${s.header.join(' | ')} |`;
        const separator = `| ${s.header.map(() => '---').join(' | ')} |`;
        const rows = s.rows.map(row => `| ${row.join(' | ')} |`).join('\n');
        return `### ${s.sectionName}\n${header}\n${separator}\n${rows}`;
    }).join('\n\n');
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
                     <div className="min-h-[200px] rounded-lg border bg-muted p-4 whitespace-pre-wrap font-mono text-sm">
                        {mySchedule ? (
                            <p>{mySchedule}</p>
                        ) : (
                            <div className="flex h-full items-center justify-center pt-16 font-sans">
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
