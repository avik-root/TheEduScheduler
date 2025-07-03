'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomRequest } from '@/lib/requests';
import { updateRequestStatus } from '@/lib/requests';

interface RoomRequestsProps {
    initialRequests: RoomRequest[];
    adminEmail: string;
}

export function RoomRequests({ initialRequests, adminEmail }: RoomRequestsProps) {
    const [requests, setRequests] = React.useState<RoomRequest[]>(initialRequests);
    const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
    const { toast } = useToast();

    const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected') => {
        setLoadingStates(prev => ({ ...prev, [requestId]: true }));
        const result = await updateRequestStatus(adminEmail, requestId, status);
        if (result.success) {
            toast({
                title: 'Request Updated',
                description: result.message,
            });
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
        } else {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.message,
            });
        }
        setLoadingStates(prev => ({ ...prev, [requestId]: false }));
    };

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
                <CardTitle className="flex items-center gap-2"><Inbox /> Room Requests</CardTitle>
                <CardDescription>
                    Review and respond to temporary room booking requests from faculty.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                        <p className="text-muted-foreground">No room requests received yet.</p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Faculty</TableHead>
                                    <TableHead>Room</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.facultyName}</div>
                                            <div className="text-xs text-muted-foreground">{req.facultyEmail}</div>
                                        </TableCell>
                                        <TableCell>{req.roomName}</TableCell>
                                        <TableCell>
                                            {req.date}
                                            <div className="text-xs text-muted-foreground">{req.startTime} - {req.endTime}</div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                                        <TableCell>
                                            <Badge className={cn("text-xs capitalize", getStatusColor(req.status))}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    {loadingStates[req.id] ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-100" onClick={() => handleUpdateStatus(req.id, 'approved')}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-100" onClick={() => handleUpdateStatus(req.id, 'rejected')}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : '—'}
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
