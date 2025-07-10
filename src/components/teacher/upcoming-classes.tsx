
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export interface UpcomingClass {
    time: string;
    subject: string;
    programYear: string;
    section: string;
    room: string;
    key: string;
    status: 'pending' | 'conducted' | 'not-conducted';
}

interface UpcomingClassesProps {
    classes: UpcomingClass[];
    onStatusChange: (key: string, newStatus: 'conducted' | 'not-conducted') => void;
}

export function UpcomingClasses({ classes, onStatusChange }: UpcomingClassesProps) {
    if (classes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon />
                        Upcoming Classes for Today ({format(new Date(), 'PPP')})
                    </CardTitle>
                    <CardDescription>
                        You have no classes scheduled for today.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
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
                            {classes.map((c) => (
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-100" onClick={() => onStatusChange(c.key, 'conducted')}>
                                                    <Check className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-100" onClick={() => onStatusChange(c.key, 'not-conducted')}>
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
            </CardContent>
        </Card>
    );
}

