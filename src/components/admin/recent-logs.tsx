
'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { User, Mail, Search, LogIn, LogOut, CheckCircle, XCircle, Download } from 'lucide-react';
import { format, formatDistanceToNow, subDays, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';
import type { FacultyLog } from '@/lib/logs';
import { getFacultyLogs } from '@/lib/logs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Faculty } from '@/lib/faculty';
import { Button } from '@/components/ui/button';

interface RecentLogsProps {
    logs: FacultyLog[];
    adminEmail: string;
    faculty: Faculty[];
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


export function RecentLogs({ logs: initialLogs, adminEmail, faculty }: RecentLogsProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isClient, setIsClient] = React.useState(false);
    const [sessions, setSessions] = React.useState<Session[]>(() => processLogsToSessions(initialLogs));
    const [selectedFaculty, setSelectedFaculty] = React.useState<string>('all');
    const [dateRange, setDateRange] = React.useState<string>('all');

    React.useEffect(() => {
        setIsClient(true);
        const interval = setInterval(async () => {
            const latestLogs = await getFacultyLogs(adminEmail);
            setSessions(processLogsToSessions(latestLogs));
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [adminEmail]);


    const filteredSessions = React.useMemo(() => {
        let sessionsToFilter = sessions;

        if (selectedFaculty !== 'all') {
            sessionsToFilter = sessionsToFilter.filter(s => s.facultyEmail === selectedFaculty);
        }

        if (dateRange !== 'all') {
            const now = new Date();
            let interval: { start: Date, end: Date };

            if (dateRange === 'current_week') {
                interval = { start: startOfWeek(now), end: endOfWeek(now) };
            } else if (dateRange === 'last_week') {
                const lastWeekStart = startOfWeek(subWeeks(now, 1));
                interval = { start: lastWeekStart, end: endOfWeek(lastWeekStart) };
            } else if (dateRange === 'last_30_days') {
                interval = { start: subDays(now, 30), end: now };
            } else {
                interval = { start: new Date(0), end: now };
            }

            sessionsToFilter = sessionsToFilter.filter(s => {
                const loginDate = new Date(s.loginTime);
                return isWithinInterval(loginDate, interval);
            });
        }
        
        if (searchQuery) {
            return sessionsToFilter.filter(session => 
                session.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                session.facultyEmail.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return sessionsToFilter;
    }, [sessions, selectedFaculty, dateRange, searchQuery]);
    
    const handleDownload = () => {
        const headers = ['Faculty Name', 'Faculty Email', 'Status', 'Login Time', 'Logout Time'];
        const rows = filteredSessions.map(session => [
            `"${session.facultyName.replace(/"/g, '""')}"`,
            `"${session.facultyEmail}"`,
            `"${session.status}"`,
            `"${format(new Date(session.loginTime), 'yyyy-MM-dd HH:mm:ss')}"`,
            session.logoutTime ? `"${format(new Date(session.logoutTime), 'yyyy-MM-dd HH:mm:ss')}"` : '""'
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `faculty-logs-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

    if (initialLogs.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                <p className="text-muted-foreground">No login events have been recorded yet.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-end">
                <div className="grid gap-2 flex-1 min-w-[200px]">
                    <label htmlFor="faculty-filter" className="text-sm font-medium">Filter by Faculty</label>
                    <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                        <SelectTrigger id="faculty-filter">
                            <SelectValue placeholder="Select Faculty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Faculty</SelectItem>
                            {faculty.map(f => <SelectItem key={f.email} value={f.email}>{f.name} ({f.abbreviation})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2 flex-1 min-w-[200px]">
                    <label htmlFor="daterange-filter" className="text-sm font-medium">Filter by Date</label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger id="daterange-filter">
                            <SelectValue placeholder="Select Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="current_week">This Week</SelectItem>
                            <SelectItem value="last_week">Last Week</SelectItem>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-shrink-0">
                    <Button onClick={handleDownload} disabled={filteredSessions.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                    </Button>
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search current results by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {filteredSessions.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                    <p className="text-muted-foreground">No sessions found matching your filters.</p>
                </div>
            ) : (
                <ScrollArea className="h-[60vh] rounded-md border">
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
