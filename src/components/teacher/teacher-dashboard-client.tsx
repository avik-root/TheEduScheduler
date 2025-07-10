
'use client';

import * as React from 'react';
import { User, Clock, CalendarOff, Settings, Building, CalendarCheck, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Faculty } from '@/lib/faculty';
import type { Admin } from '@/lib/admin';
import type { Room } from '@/lib/buildings';
import { ChangePasswordDialog } from '@/components/teacher/change-password-dialog';
import { RoomAvailabilityChecker } from '../admin/room-availability-checker';
import type { RoomRequest } from '@/lib/requests';
import { MyRequestsList } from './my-requests-list';
import { Button } from '../ui/button';
import { TwoFactorSettingsDialog } from './two-factor-settings-dialog';

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

interface ParsedSchedule {
    programYearTitle: string;
    sections: SectionSchedule[];
}

function parseCompleteSchedule(markdown: string): ParsedSchedule | null {
    if (!markdown || markdown.trim() === '') {
        return null;
    }

    const lines = markdown.trim().split('\n');
    let programYearTitle = "Published Schedule"; // Default title
    let scheduleContent = markdown;

    if (lines[0].startsWith('## ')) {
        programYearTitle = lines[0].substring(3).trim();
        scheduleContent = lines.slice(1).join('\n');
    }

    const sectionsMarkdown = scheduleContent.trim().split(/###\s*(.*?)\s*\n/g).filter(Boolean);
    const parsedSections: SectionSchedule[] = [];

    for (let i = 0; i < sectionsMarkdown.length; i += 2) {
        const sectionName = sectionsMarkdown[i].trim().replace(/###\s*/, '');
        const tableMarkdown = sectionsMarkdown[i + 1];

        if (!tableMarkdown || !tableMarkdown.includes('|')) continue;

        const tableLines = tableMarkdown.trim().split('\n').map(line => line.trim()).filter(Boolean);
        if (tableLines.length < 2) continue;

        const headerLine = tableLines[0];
        const separatorLine = tableLines[1];
        if (!headerLine.includes('|') || !separatorLine.includes('|--')) continue;

        const header = headerLine.split('|').map(h => h.trim()).filter(Boolean);
        const rows = tableLines.slice(2).map(line =>
            line.split('|').map(cell => cell.trim()).filter(Boolean)
        ).filter(row => row.length === header.length);

        if (header.length > 0 && rows.length > 0) {
            parsedSections.push({ sectionName, header, rows });
        }
    }
    
    return { programYearTitle, sections: parsedSections };
}

export function TeacherDashboardClient({ faculty, admin, adminEmail, allRooms, schedule, initialRequests }: TeacherDashboardClientProps) {
  const [showMyScheduleOnly, setShowMyScheduleOnly] = React.useState(true);

  const displayedSchedule = React.useMemo(() => {
    if (!schedule) return null;
    
    const parsedData = parseCompleteSchedule(schedule);
    if (!parsedData) return null;

    if (showMyScheduleOnly && faculty.abbreviation) {
        const facultyAbbr = `(${faculty.abbreviation})`;

        const facultySchedules = parsedData.sections.map(section => {
            // For each row (day), map over its cells and replace non-faculty classes with '-'
            const newRows = section.rows.map(row => {
                const dayName = row[0]; // Keep the day name
                const classCells = row.slice(1);
                const filteredCells = classCells.map(cell => 
                    cell.includes(facultyAbbr) ? cell : '-'
                );
                return [dayName, ...filteredCells];
            })
            // Then, filter out days where the faculty has no classes at all
            .filter(row => row.slice(1).some(cell => cell !== '-'));

            return {
                ...section,
                rows: newRows,
            };
        })
        // Finally, filter out entire sections where the faculty has no classes
        .filter(section => section.rows.length > 0);
        
        return { ...parsedData, sections: facultySchedules };
    } else {
        return parsedData;
    }
  }, [schedule, faculty.abbreviation, showMyScheduleOnly]);

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
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your account security features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <ChangePasswordDialog facultyEmail={faculty.email} adminEmail={adminEmail} />
                    <TwoFactorSettingsDialog faculty={faculty} adminEmail={adminEmail} />
                </CardContent>
              </Card>
          </div>
          <div className="pt-8 grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div className="grid gap-1">
                            <CardTitle className="flex items-center gap-2"><CalendarCheck /> {showMyScheduleOnly ? 'My Weekly Schedule' : 'Full Weekly Schedule'}</CardTitle>
                            <CardDescription>{displayedSchedule?.programYearTitle || 'A schedule has not been published yet.'}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowMyScheduleOnly(!showMyScheduleOnly)}>
                            {showMyScheduleOnly ? 'Show Full Schedule' : 'Show My Schedule'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                     {displayedSchedule && displayedSchedule.sections.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {displayedSchedule.sections.map((sectionSchedule, sectionIndex) => (
                                <Card key={sectionIndex}>
                                    <CardHeader>
                                        <CardTitle>{sectionSchedule.sectionName}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="overflow-x-auto p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {sectionSchedule.header.map((head, index) => (
                                                        <TableHead key={index}>{head}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sectionSchedule.rows.map((row, rowIndex) => (
                                                    <TableRow key={rowIndex}>
                                                        {row.map((cell, cellIndex) => (
                                                            <TableCell key={cellIndex} className="whitespace-nowrap">{cell}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                            <p className="text-muted-foreground text-center">
                                {!schedule
                                    ? "A schedule has not been published yet."
                                    : showMyScheduleOnly
                                        ? "You have no classes in the published schedule."
                                        : "No sections found in the published schedule."
                                }
                            </p>
                        </div>
                    )}
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
