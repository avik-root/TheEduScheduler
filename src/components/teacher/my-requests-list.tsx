'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomRequest } from '@/lib/requests';
import { getFacultyRoomRequests } from '@/lib/requests';

interface MyRequestsListProps {
    initialRequests: RoomRequest[];
    adminEmail: string;
    facultyEmail: string;
}

export function MyRequestsList({ initialRequests, adminEmail, facultyEmail }: MyRequestsListProps) {
    const [requests, setRequests] = React.useState<RoomRequest[]>(initialRequests);

    React.useEffect(() => {
        const interval = setInterval(async () => {
            const latestRequests = await getFacultyRoomRequests(adminEmail, facultyEmail);
            setRequests(latestRequests);
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [adminEmail, facultyEmail]);


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History /> My Room Requests</CardTitle>
                <CardDescription>
                    Track the status of your temporary room booking requests. This list updates automatically.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                        <p className="text-muted-foreground">You have not made any room requests yet.</p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Room</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.roomName}</TableCell>
                                        <TableCell>
                                            {req.date}
                                            <div className="text-xs text-muted-foreground">{req.startTime} - {req.endTime}</div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={cn("text-xs capitalize", getStatusColor(req.status))}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
