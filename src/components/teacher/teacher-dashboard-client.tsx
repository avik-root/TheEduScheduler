
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Clock, CalendarOff, Settings, ShieldAlert, CalendarCheck, ShieldCheck, ClipboardCheck, ClipboardX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Faculty } from '@/lib/faculty';
import type { Admin } from '@/lib/admin';
import type { Room } from '@/lib/buildings';
import { ChangePasswordDialog } from '@/components/teacher/change-password-dialog';
import { RoomAvailabilityChecker } from '../admin/room-availability-checker';
import type { RoomRequest } from '@/lib/requests';
import { MyRequestsList } from './my-requests-list';
import { Button } from '../ui/button';
import { TwoFactorSettingsDialog } from './two-factor-settings-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UpcomingClasses, type UpcomingClass } from './upcoming-classes';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

    const scheduleParts = ('\n' + markdown.trim()).split(/\n## /).filter(s => s.trim() !== '');

    if (scheduleParts.length === 0) return null;

    return scheduleParts.map(part => {
        const lines = part.trim().split('\n');
        const programYearTitle = lines[0] || 'Schedule'; 
        const content = lines.slice(1).join('\n');

        const sectionParts = content.trim().split(/###\s*(.*?)\s*\n/g).filter(Boolean);
        const parsedSections: SectionSchedule[] = [];

        for (let i = 0; i < sectionParts.length; i += 2) {
            const sectionName = sectionParts[i].trim().replace(/###\s*/, '');
            const tableMarkdown = sectionParts[i + 1];

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
    }).filter(s => s.sections.length > 0)[0] || null;
}

export function TeacherDashboardClient({ faculty, admin, adminEmail, allRooms, schedule, initialRequests }: TeacherDashboardClientProps) {
  const [showMyScheduleOnly, setShowMyScheduleOnly] = React.useState(true);
  const [show2FADisabledAlert, setShow2FADisabledAlert] = React.useState(false);
  const [show2FAPrompt, setShow2FAPrompt] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [todaysClasses, setTodaysClasses] = React.useState<UpcomingClass[]>([]);
  const searchParams = useSearchParams();
  const parsedFullSchedule = React.useMemo(() => parseCompleteSchedule(schedule), [schedule]);

  React.useEffect(() => {
    if (searchParams.get('show2FADisabled') === 'true') {
        setShow2FADisabledAlert(true);
        window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/&?show2FADisabled=true/, ''));
    }
    if (searchParams.get('prompt2FA') === 'true') {
        setShow2FAPrompt(true);
         window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/&?prompt2FA=true/, ''));
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!parsedFullSchedule || !faculty.abbreviation) {
        setTodaysClasses([]);
        return;
    }

    const today = format(new Date(), 'EEEE');
    const facultyAbbr = `(${faculty.abbreviation})`;
    const classes: UpcomingClass[] = [];

    parsedFullSchedule.sections.forEach(section => {
        const dayRow = section.rows.find(row => row[0].toLowerCase() === today.toLowerCase());

        if (dayRow) {
            dayRow.forEach((cell, index) => {
                if (index > 0 && cell.includes(facultyAbbr) && cell !== '-') {
                    const timeSlot = section.header[index];
                    const roomMatch = cell.match(/in ([\w\s-]+)$/);
                    const subject = cell.replace(facultyAbbr, '').replace(/in [\w\s-]+$/, '').trim();
                    const key = `${parsedFullSchedule.programYearTitle}-${section.sectionName}-${timeSlot}`;
                    
                    classes.push({
                        time: timeSlot,
                        subject: subject,
                        programYear: parsedFullSchedule.programYearTitle,
                        section: section.sectionName,
                        room: roomMatch ? roomMatch[1] : 'N/A',
                        key: key,
                        status: 'pending'
                    });
                }
            });
        }
    });
    classes.sort((a, b) => a.time.localeCompare(b.time));
    setTodaysClasses(classes);
  }, [parsedFullSchedule, faculty.abbreviation]);

  const handleStatusChange = (key: string, newStatus: 'conducted' | 'not-conducted') => {
    setTodaysClasses(prevClasses => 
        prevClasses.map(c => 
            c.key === key ? { ...c, status: newStatus } : c
        )
    );
  };

  const conductedCount = todaysClasses.filter(c => c.status === 'conducted').length;
  const notConductedCount = todaysClasses.filter(c => c.status === 'not-conducted').length;

  const displayedSchedule = React.useMemo(() => {
    if (!parsedFullSchedule) return null;
    
    if (showMyScheduleOnly && faculty.abbreviation) {
        const facultyAbbr = `(${faculty.abbreviation})`;

        const facultySchedules = parsedFullSchedule.sections.map(section => {
            const newRows = section.rows.map(row => {
                const dayName = row[0];
                const classCells = row.slice(1);
                const filteredCells = classCells.map(cell => 
                    cell.includes(facultyAbbr) ? cell : '-'
                );
                return [dayName, ...filteredCells];
            })
            .filter(row => row.slice(1).some(cell => cell !== '-'));

            return {
                ...section,
                rows: newRows,
            };
        })
        .filter(section => section.rows.length > 0);
        
        return { ...parsedFullSchedule, sections: facultySchedules };
    } else {
        return parsedFullSchedule;
    }
  }, [parsedFullSchedule, faculty.abbreviation, showMyScheduleOnly]);

  return (
     <>
        <AlertDialog open={show2FADisabledAlert} onOpenChange={setShow2FADisabledAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-yellow-500" />
                        Security Update
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        An administrator has disabled Two-Factor Authentication (2FA) for your account. We recommend re-enabling it in your Security Settings for better protection.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction onClick={() => setShow2FADisabledAlert(false)}>
                    Acknowledge
                </AlertDialogAction>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={show2FAPrompt} onOpenChange={setShow2FAPrompt}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Enhance Your Account Security
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Enable Two-Factor Authentication (2FA) for an extra layer of protection. It&apos;s quick, easy, and keeps your account safe. This is a security reminder from{' '}
                        <span className="font-semibold">
                            <span className="text-red-500">Mint</span><span className="text-green-500">Fire</span>
                        </span>
                        .
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Maybe Later</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        setShow2FAPrompt(false);
                        setSettingsDialogOpen(true);
                    }}>
                        Enable 2FA Now
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


        <div className="mx-auto grid w-full max-w-6xl gap-6">
            <div className="my-8">
                <h1 className="text-3xl font-semibold">Faculty Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {faculty.name}. View your schedule and manage your availability.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
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
                        <CardTitle>Classes Conduct</CardTitle>
                        <CardDescription>Summary of your classes for today.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <ClipboardCheck className="h-5 w-5" />
                                <span className="font-semibold">Conducted: {conductedCount}</span>
                            </div>
                            <div className="flex items-center gap-2 text-red-600">
                                <ClipboardX className="h-5 w-5" />
                                <span className="font-semibold">Not Conducted: {notConductedCount}</span>
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
                        <TwoFactorSettingsDialog faculty={faculty} adminEmail={adminEmail} open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />
                    </CardContent>
                </Card>
            </div>
            <div className="pt-8 grid gap-6">
                 <UpcomingClasses classes={todaysClasses} onStatusChange={handleStatusChange} />
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div className="grid gap-1">
                                <CardTitle className="flex items-center gap-2"><CalendarCheck /> {showMyScheduleOnly ? 'My Weekly Schedule' : 'Full Weekly Schedule'}</CardTitle>
                                <CardDescription>{parsedFullSchedule?.programYearTitle || 'A schedule has not been published yet.'}</CardDescription>
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
     </>
  );
}
