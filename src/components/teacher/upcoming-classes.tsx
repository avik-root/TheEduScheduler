
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Calendar as CalendarIcon, ClipboardCheck, ClipboardX } from 'lucide-react';
import { format } from 'date-fns';

interface SectionSchedule {
  sectionName: string;
  header: string[];
  rows: string[][];
}

interface ParsedSchedule {
    programYearTitle: string;
    sections: SectionSchedule[];
}

interface UpcomingClass {
    time: string;
    subject: string;
    programYear: string;
    section: string;
    room: string;
    key: string;
    status: 'pending' | 'conducted' | 'not-conducted';
}

interface UpcomingClassesProps {
    schedule: ParsedSchedule | null;
    facultyAbbreviation: string;
}

export function UpcomingClasses({ schedule, facultyAbbreviation }: UpcomingClassesProps) {
    const [todaysClasses, setTodaysClasses] = React.useState<UpcomingClass[]>([]);

    React.useEffect(() => {
        if (!schedule || !facultyAbbreviation) {
            setTodaysClasses([]);
            return;
        }

        const today = format(new Date(), 'EEEE'); // e.g., "Monday"
        const facultyAbbr = `(${facultyAbbreviation})`;
        const classes: UpcomingClass[] = [];

        schedule.sections.forEach(section => {
            const dayRow = section.rows.find(row => row[0].toLowerCase() === today.toLowerCase());

            if (dayRow) {
                dayRow.forEach((cell, index) => {
                    if (index > 0 && cell.includes(facultyAbbr) && cell !== '-') {
                        const timeSlot = section.header[index];
                        const roomMatch = cell.match(/in ([\w\s-]+)$/);
                        const subject = cell.replace(facultyAbbr, '').replace(/in [\w\s-]+$/, '').trim();
                        const key = `${schedule.programYearTitle}-${section.sectionName}-${timeSlot}`;
                        
                        classes.push({
                            time: timeSlot,
                            subject: subject,
                            programYear: schedule.programYearTitle,
                            section: section.sectionName,
                            room: roomMatch ? roomMatch[1] : 'N/A',
                            key: key,
                            status: 'pending'
                        });
                    }
                });
            }
        });

        // Sort classes by time
        classes.sort((a, b) => a.time.localeCompare(b.time));

        setTodaysClasses(classes);
    }, [schedule, facultyAbbreviation]);

    const handleStatusChange = (key: string, newStatus: 'conducted' | 'not-conducted') => {
        setTodaysClasses(prevClasses => 
            prevClasses.map(c => 
                c.key === key ? { ...c, status: newStatus } : c
            )
        );
    };

    const conductedCount = todaysClasses.filter(c => c.status === 'conducted').length;
    const notConductedCount = todaysClasses.filter(c => c.status === 'not-conducted').length;

    if (!schedule) {
        return null; // Don't render anything if there's no schedule
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon />
                    Upcoming Classes for Today ({format(new Date(), 'PPP')})
                </CardTitle>
                <CardDescription>
                    Mark the status of your classes for today.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-8 mb-6">
                    <div className="flex items-center gap-2 text-green-600">
                        <ClipboardCheck className="h-5 w-5" />
                        <span className="font-semibold">Conducted: {conductedCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                        <ClipboardX className="h-5 w-5" />
                        <span className="font-semibold">Not Conducted: {notConductedCount}</span>
                    </div>
                </div>
                {todaysClasses.length > 0 ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time (Block)</TableHead>
                                    <TableHead>Class Details</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todaysClasses.map((c) => (
                                    <TableRow key={c.key}>
                                        <TableCell className="font-medium">{c.time}</TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{c.subject}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {c.programYear} / {c.section} / Room: {c.room}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {c.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-100" onClick={() => handleStatusChange(c.key, 'conducted')}>
                                                        <Check className="h-5 w-5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-100" onClick={() => handleStatusChange(c.key, 'not-conducted')}>
                                                        <X className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className={`text-sm font-semibold ${c.status === 'conducted' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {c.status === 'conducted' ? 'Conducted' : 'Not Conducted'}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                     <div className="flex h-24 items-center justify-center rounded-lg border bg-muted">
                        <p className="text-muted-foreground">You have no classes scheduled for today.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
