
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Clock, CalendarOff, Settings, ShieldAlert, CalendarCheck, ShieldCheck, ClipboardCheck, ClipboardX, AlertTriangle } from 'lucide-react';
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
import { format, differenceInDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConductStatusDialog } from './conduct-status-dialog';
import { ReleaseRoomDialog } from './release-room-dialog';
import { releaseRoom } from '@/lib/requests';
import { useToast } from '@/hooks/use-toast';
import { getConductLogForDay, setConductStatus, type ConductLogEntry } from '@/lib/conduct';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

function parseCompleteSchedule(markdown: string): ParsedSchedule[] | null {
    if (!markdown || markdown.trim() === '') return null;

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
    }).filter(s => s.sections.length > 0);
}

export function TeacherDashboardClient({ faculty, admin, adminEmail, allRooms, schedule, initialRequests }: TeacherDashboardClientProps) {
  const [showMyScheduleOnly, setShowMyScheduleOnly] = React.useState(true);
  const [show2FADisabledAlert, setShow2FADisabledAlert] = React.useState(false);
  const [show2FAPrompt, setShow2FAPrompt] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [todaysClasses, setTodaysClasses] = React.useState<UpcomingClass[]>([]);
  const [isConductDialogOpen, setIsConductDialogOpen] = React.useState(false);
  const [dialogContent, setDialogContent] = React.useState<{ title: string; classes: UpcomingClass[] }>({ title: '', classes: [] });
  const [releaseDialogOpen, setReleaseDialogOpen] = React.useState(false);
  const [classToRelease, setClassToRelease] = React.useState<UpcomingClass | null>(null);
  const [passwordDaysUntilExpiry, setPasswordDaysUntilExpiry] = React.useState<number | null>(null);
  const { toast } = useToast();

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
    
    if (faculty.passwordLastChanged) {
        const passwordDate = new Date(faculty.passwordLastChanged);
        const expiryDate = new Date(passwordDate.setDate(passwordDate.getDate() + 217));
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());
        setPasswordDaysUntilExpiry(daysUntilExpiry);
    }
  }, [searchParams, faculty.passwordLastChanged]);

  React.useEffect(() => {
    const fetchTodaysClasses = async () => {
        if (!parsedFullSchedule || !faculty.abbreviation) {
            setTodaysClasses([]);
            return;
        }

        const today = new Date();
        const todayStr = format(today, 'EEEE');
        const facultyAbbr = `(${faculty.abbreviation})`;
        const classes: UpcomingClass[] = [];
        
        const conductLog = await getConductLogForDay(adminEmail, today);

        parsedFullSchedule.forEach(scheduleItem => {
            scheduleItem.sections.forEach(section => {
                const dayRow = section.rows.find(row => row[0].toLowerCase() === todayStr.toLowerCase());

                if (dayRow) {
                    dayRow.forEach((cell, index) => {
                        if (index > 0 && cell.includes(facultyAbbr) && cell !== '-') {
                            const timeSlot = section.header[index];
                            const roomMatch = cell.match(/in ([\w\s-]+)$/);
                            const subject = cell.replace(facultyAbbr, '').replace(/in [\w\s-]+$/, '').trim();
                            const key = `${scheduleItem.programYearTitle}-${section.sectionName}-${todayStr}-${timeSlot}`;
                            
                            const logEntry = conductLog.find(log => log.classKey === key && log.facultyEmail === faculty.email);
                            
                            classes.push({
                                time: timeSlot,
                                subject: subject,
                                programYear: scheduleItem.programYearTitle,
                                section: section.sectionName,
                                room: roomMatch ? roomMatch[1] : 'N/A',
                                key: key,
                                status: logEntry ? logEntry.status : 'pending'
                            });
                        }
                    });
                }
            });
        });

        classes.sort((a, b) => a.time.localeCompare(b.time));
        setTodaysClasses(classes);
    };

    fetchTodaysClasses();
  }, [parsedFullSchedule, faculty.abbreviation, faculty.email, adminEmail]);

  const handleStatusChange = async (key: string, newStatus: 'conducted' | 'not-conducted') => {
    if (newStatus === 'conducted') {
        setTodaysClasses(prevClasses => 
            prevClasses.map(c => 
                c.key === key ? { ...c, status: newStatus } : c
            )
        );
        await setConductStatus(adminEmail, { classKey: key, facultyEmail: faculty.email, date: new Date(), status: newStatus });
    } else {
        const classToHandle = todaysClasses.find(c => c.key === key);
        if (classToHandle) {
            setClassToRelease(classToHandle);
            setReleaseDialogOpen(true);
        }
    }
  };
  
  const handleReleaseDialogAction = async (shouldRelease: boolean) => {
    if (!classToRelease) return;
    const newStatus = 'not-conducted';

    if (shouldRelease) {
        const [startTime, endTime] = classToRelease.time.split('-');
        const result = await releaseRoom(adminEmail, {
            facultyEmail: faculty.email,
            facultyName: faculty.name,
            roomName: classToRelease.room,
            date: format(new Date(), 'PPP'),
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            reason: `Class Canceled / Room Released: ${classToRelease.subject}`,
        });
        
        if (result.success) {
            toast({ title: 'Room Released', description: `Room ${classToRelease.room} is now available.` });
        } else {
            toast({ variant: 'destructive', title: 'Failed to Release Room', description: result.message });
        }
    }
    
    // Update the class status in state and persist it
    setTodaysClasses(prevClasses => 
        prevClasses.map(c => 
            c.key === classToRelease.key ? { ...c, status: newStatus } : c
        )
    );
    await setConductStatus(adminEmail, { classKey: classToRelease.key, facultyEmail: faculty.email, date: new Date(), status: newStatus });

    setReleaseDialogOpen(false);
    setClassToRelease(null);
  };


  const conductedClasses = todaysClasses.filter(c => c.status === 'conducted');
  const notConductedClasses = todaysClasses.filter(c => c.status === 'not-conducted');
  
  const handleShowConducted = () => {
      setDialogContent({ title: 'Conducted Classes', classes: conductedClasses });
      setIsConductDialogOpen(true);
  };

  const handleShowNotConducted = () => {
      setDialogContent({ title: 'Not Conducted Classes', classes: notConductedClasses });
      setIsConductDialogOpen(true);
  };


  const displayedSchedule = React.useMemo(() => {
    if (!parsedFullSchedule) return null;
    
    if (showMyScheduleOnly && faculty.abbreviation) {
        const facultyAbbr = `(${faculty.abbreviation})`;
        const combinedSchedules: ParsedSchedule[] = [];

        parsedFullSchedule.forEach(scheduleItem => {
            const facultySections = scheduleItem.sections.map(section => {
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
            
            if (facultySections.length > 0) {
                combinedSchedules.push({ ...scheduleItem, sections: facultySections });
            }
        });
        
        return combinedSchedules;
    } else {
        return parsedFullSchedule;
    }
  }, [parsedFullSchedule, faculty.abbreviation, showMyScheduleOnly]);

  const passwordAlert = () => {
    if (passwordDaysUntilExpiry === null || passwordDaysUntilExpiry > 30) return null;
    
    if (passwordDaysUntilExpiry <= 7) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Urgent: Password Change Required</AlertTitle>
                <AlertDescription>
                    Your password will expire in {passwordDaysUntilExpiry} day(s). To avoid account lockout, please change it now.
                </AlertDescription>
            </Alert>
        )
    }
    return (
        <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Security Reminder: Change Your Password</AlertTitle>
            <AlertDescription>
                Your password will expire in {passwordDaysUntilExpiry} days. For security, we recommend changing it soon.
            </AlertDescription>
        </Alert>
    );
  }

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
            {passwordAlert()}
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
                    <CardContent className="pt-2">
                        <div className="flex flex-wrap items-center gap-4">
                             <Button variant="ghost" className="p-0 h-auto font-normal" onClick={handleShowConducted} disabled={conductedClasses.length === 0}>
                                <div className="flex items-center gap-2 text-green-600">
                                    <ClipboardCheck className="h-5 w-5" />
                                    <span className="font-semibold">Conducted: {conductedClasses.length}</span>
                                </div>
                            </Button>
                            <Button variant="ghost" className="p-0 h-auto font-normal" onClick={handleShowNotConducted} disabled={notConductedClasses.length === 0}>
                                <div className="flex items-center gap-2 text-red-600">
                                    <ClipboardX className="h-5 w-5" />
                                    <span className="font-semibold">Not Conducted: {notConductedClasses.length}</span>
                                </div>
                            </Button>
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
                        {passwordDaysUntilExpiry !== null && (
                            <p className="text-sm font-semibold text-muted-foreground pt-2">Password expires in {passwordDaysUntilExpiry} day(s).</p>
                        )}
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
                                <CardDescription>{parsedFullSchedule?.length > 0 ? 'Your comprehensive weekly timetable.' : 'A schedule has not been published yet.'}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowMyScheduleOnly(!showMyScheduleOnly)} disabled={!parsedFullSchedule}>
                                {showMyScheduleOnly ? 'Show Full Schedule' : 'Show My Schedule'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {displayedSchedule && displayedSchedule.length > 0 ? (
                            <div className="space-y-8">
                                {displayedSchedule.map((scheduleItem, scheduleIndex) => (
                                <Card key={scheduleIndex}>
                                    <CardHeader>
                                        <CardTitle>{scheduleItem.programYearTitle}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="overflow-x-auto p-0 md:p-6">
                                        {scheduleItem.sections.map((sectionSchedule, sectionIndex) => (
                                            <div key={sectionIndex} className="mb-6 last:mb-0">
                                                <h3 className="text-lg font-semibold mb-2 px-6 md:px-0">{sectionSchedule.sectionName}</h3>
                                                <div className="overflow-x-auto rounded-md border">
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
                                                </div>
                                            </div>
                                        ))}
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
        <ConductStatusDialog
            open={isConductDialogOpen}
            onOpenChange={setIsConductDialogOpen}
            title={dialogContent.title}
            classes={dialogContent.classes}
        />
        {classToRelease && (
            <ReleaseRoomDialog
                open={releaseDialogOpen}
                onOpenChange={setReleaseDialogOpen}
                classDetails={classToRelease}
                onConfirm={handleReleaseDialogAction}
            />
        )}
     </>
  );
}
