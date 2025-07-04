'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { User, Mail, Search, LogIn, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { FacultyLog } from '@/lib/logs';
import { getFacultyLogs } from '@/lib/logs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RecentLogsProps {
    logs: FacultyLog[];
    adminEmail: string;
}

interface Session {
    id: string;
    facultyName: string;
    facultyEmail: string;
    status: 'Active' | 'Logged Out';
    loginTime: string;
    logoutTime: string | null;
}

function processLogsToSessions(logs: FacultyLog[]): Session[] {
    const logsAsc = [...logs].reverse(); // Sort logs from oldest to newest
    const sessions: Session[] = [];
    const activeLogins = new Map<string, FacultyLog>(); // Map facultyEmail to their last login log

    for (const log of logsAsc) {
        if (log.type === 'login') {
            // If there's an existing "active" login for this user, it means they didn't log out properly.
            // We can close the old session when the new one begins.
            if (activeLogins.has(log.facultyEmail)) {
                const oldLogin = activeLogins.get(log.facultyEmail)!;
                sessions.push({
                    id: oldLogin.id + '-stale', // Mark as stale session
                    facultyName: oldLogin.facultyName,
                    facultyEmail: oldLogin.facultyEmail,
                    status: 'Logged Out',
                    loginTime: oldLogin.timestamp,
                    logoutTime: log.timestamp, // End time is the start of the new session
                });
            }
            activeLogins.set(log.facultyEmail, log);
        } else if (log.type === 'logout') {
            if (activeLogins.has(log.facultyEmail)) {
                const loginLog = activeLogins.get(log.facultyEmail)!;
                sessions.push({
                    id: loginLog.id,
                    facultyName: log.facultyName,
                    facultyEmail: log.facultyEmail,
                    status: 'Logged Out',
                    loginTime: loginLog.timestamp,
                    logoutTime: log.timestamp,
                });
                activeLogins.delete(log.facultyEmail);
            }
            // If we find a logout without a matching login, we can ignore it as it's out of sync.
        }
    }

    // Any remaining logins in the map are currently active sessions.
    activeLogins.forEach((loginLog) => {
        sessions.push({
            id: loginLog.id,
            facultyName: loginLog.facultyName,
            facultyEmail: loginLog.facultyEmail,
            status: 'Active',
            loginTime: loginLog.timestamp,
            logoutTime: null,
        });
    });

    // Sort sessions by the most recent event (either logout time or login time for active sessions)
    return sessions.sort((a, b) => {
        const timeA = new Date(a.logoutTime || a.loginTime).getTime();
        const timeB = new Date(b.logoutTime || b.loginTime).getTime();
        return timeB - timeA;
    });
}


export function RecentLogs({ logs: initialLogs, adminEmail }: RecentLogsProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isClient, setIsClient] = React.useState(false);
    const [sessions, setSessions] = React.useState<Session[]>(() => processLogsToSessions(initialLogs));

    React.useEffect(() => {
        setIsClient(true);
        const interval = setInterval(async () => {
            const latestLogs = await getFacultyLogs(adminEmail);
            setSessions(processLogsToSessions(latestLogs));
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [adminEmail]);


    const filteredSessions = sessions.filter(session => 
        session.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.facultyEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const getStatusInfo = (status: 'Active' | 'Logged Out') => {
        if (status === 'Active') {
            return {
                icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
                text: 'Active'
            };
        }
        return {
            icon: <XCircle className="h-4 w-4 text-red-500" />,
            badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            text: 'Logged Out'
        };
    }

    if (sessions.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                <p className="text-muted-foreground">No login events have been recorded yet.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by faculty name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredSessions.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                    <p className="text-muted-foreground">No sessions found matching your search.</p>
                </div>
            ) : (
                <ScrollArea className="h-[70vh] rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Faculty</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Login Time</TableHead>
                                <TableHead>Logout Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSessions.map((session) => {
                                const statusInfo = getStatusInfo(session.status);
                                return (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        <div className="font-medium flex items-center gap-2"><User className="h-4 w-4" />{session.facultyName}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2 ml-6"><Mail className="h-3 w-3" />{session.facultyEmail}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("text-xs capitalize", statusInfo.badgeClass)}>
                                            <span className="flex items-center gap-1.5">
                                              {statusInfo.icon}
                                              {statusInfo.text}
                                            </span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2"><LogIn className="h-4 w-4" />{isClient ? formatDistanceToNow(new Date(session.loginTime), { addSuffix: true }) : '...'}</div>
                                        <div className="text-xs text-muted-foreground ml-6">{isClient ? format(new Date(session.loginTime), 'PPP p') : '...'}</div>
                                    </TableCell>
                                     <TableCell>
                                        {session.logoutTime ? (
                                            <>
                                                <div className="flex items-center gap-2"><LogOut className="h-4 w-4" />{isClient ? formatDistanceToNow(new Date(session.logoutTime), { addSuffix: true }) : '...'}</div>
                                                <div className="text-xs text-muted-foreground ml-6">{isClient ? format(new Date(session.logoutTime), 'PPP p') : '...'}</div>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </ScrollArea>
            )}
        </div>
    );
}
