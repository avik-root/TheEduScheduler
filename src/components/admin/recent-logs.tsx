
'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Mail, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { FacultyLog } from '@/lib/logs';

interface RecentLogsProps {
    logs: FacultyLog[];
}

export function RecentLogs({ logs }: RecentLogsProps) {
    if (logs.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                <p className="text-muted-foreground">No login events have been recorded yet.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[70vh] rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Timestamp</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell>
                                <div className="font-medium flex items-center gap-2"><User className="h-4 w-4" />{log.facultyName}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 ml-6"><Mail className="h-3 w-3" />{log.facultyEmail}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</div>
                                <div className="text-xs text-muted-foreground ml-6">{format(new Date(log.timestamp), 'PPP p')}</div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
}
