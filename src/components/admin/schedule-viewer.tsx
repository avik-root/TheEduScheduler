'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, CalendarCheck, ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { DeleteScheduleDialog } from './delete-schedule-dialog';
import { DeleteSingleScheduleDialog } from './delete-single-schedule-dialog';

interface ScheduleViewerProps {
  schedule: string;
  adminEmail: string;
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

function parseMultipleSchedules(markdown: string): ParsedSchedule[] | null {
    if (!markdown || markdown.trim() === '') return null;

    const scheduleParts = ('\n' + markdown.trim()).split(/\n## /).filter(s => s.trim() !== '');

    if (scheduleParts.length === 0) return null;

    return scheduleParts.map(part => {
        const lines = part.trim().split('\n');
        const programYearTitle = lines[0] || 'Schedule'; 
        const content = lines.slice(1).join('\n');

        const sectionParts = content.split(/\n### /).filter(s => s.trim() !== '');

        const sections = sectionParts.map(sectionPart => {
            const sectionLines = sectionPart.trim().split('\n');
            const sectionName = sectionLines[0] || 'Section';
            const tableMarkdown = sectionLines.slice(1).join('\n');

            const tableLines = tableMarkdown.trim().split('\n').map(line => line.trim()).filter(Boolean);
            if (tableLines.length < 2) return null;

            const headerLine = tableLines[0];
            const separatorLine = tableLines[1];
            if (!headerLine.includes('|') || !separatorLine.includes('|--')) return null;

            const header = headerLine.split('|').map(h => h.trim()).filter(Boolean);
            const rows = tableLines.slice(2).map(line =>
                line.split('|').map(cell => cell.trim()).filter(Boolean)
            ).filter(row => row.length === header.length);

            if (header.length > 0 && rows.length > 0) {
                return { sectionName, header, rows };
            }
            return null;
        }).filter((s): s is SectionSchedule => s !== null);

        return { programYearTitle, sections };
    }).filter(s => s.sections.length > 0);
}


export function ScheduleViewer({ schedule, adminEmail }: ScheduleViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const parsedSchedules = React.useMemo(() => parseMultipleSchedules(schedule), [schedule]);
  const dashboardPath = `/admin/dashboard?email=${adminEmail}`;

  const filteredSchedules = React.useMemo(() => {
    if (!parsedSchedules) return [];
    if (!searchQuery.trim()) return parsedSchedules;

    const lowercasedQuery = searchQuery.toLowerCase();
    
    return parsedSchedules.map(scheduleItem => {
        if (scheduleItem.programYearTitle.toLowerCase().includes(lowercasedQuery)) {
            return scheduleItem;
        }

        const filteredSections = scheduleItem.sections.filter(section => {
          const sectionMatches = section.sectionName.toLowerCase().includes(lowercasedQuery);
          if (sectionMatches) return true;

          const contentMatches = section.rows.some(row => 
            row.some(cell => cell.toLowerCase().includes(lowercasedQuery))
          );
          return contentMatches;
        });

        if(filteredSections.length > 0) {
            return { ...scheduleItem, sections: filteredSections };
        }
        return null;
    }).filter((s): s is ParsedSchedule => s !== null);

  }, [parsedSchedules, searchQuery]);


  const handleDownloadCsv = (scheduleToDownload?: ParsedSchedule) => {
    const schedulesToExport = scheduleToDownload ? [scheduleToDownload] : filteredSchedules;
    if (!schedulesToExport || schedulesToExport.length === 0) return;

    const convertTo12Hour = (time24: string): string => {
        if (!/^\d{2}:\d{2}$/.test(time24)) return time24;
        const [hours, minutes] = time24.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        let hours12 = hours % 12;
        hours12 = hours12 || 12;
        const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
        return `${hours12}:${minutesStr} ${ampm}`;
    };

    const formatTimeRange = (range: string): string => {
        const times = range.split('-');
        if (times.length === 2 && times.every(t => /^\d{2}:\d{2}$/.test(t.trim()))) {
            return `${convertTo12Hour(times[0].trim())} - ${convertTo12Hour(times[1].trim())}`;
        }
        return range;
    };

    const formatCsvRow = (row: string[], isHeader = false) => {
        const formattedRow = row.map((cell, index) => {
            const finalCell = (isHeader && index > 0) ? formatTimeRange(cell) : cell;
            const escapedCell = finalCell.replace(/"/g, '""');
            return `"${escapedCell}"`;
        });
        return formattedRow.join(',');
    };

    let csvContent: string[] = [];

    schedulesToExport.forEach((scheduleItem, scheduleIdx) => {
        csvContent.push(`"${scheduleItem.programYearTitle}"`);
        csvContent.push('');

        scheduleItem.sections.forEach((sectionSchedule, sectionIndex) => {
          csvContent.push(`"${sectionSchedule.sectionName}"`);
          csvContent.push(formatCsvRow(sectionSchedule.header, true));
          sectionSchedule.rows.forEach(row => {
            csvContent.push(formatCsvRow(row));
          });
          if (sectionIndex < scheduleItem.sections.length - 1) {
            csvContent.push('');
          }
        });

        if (scheduleIdx < schedulesToExport.length - 1) {
            csvContent.push('');
            csvContent.push('');
        }
    });

    const csvString = csvContent.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = scheduleToDownload
        ? `EduScheduler_${scheduleToDownload.programYearTitle.replace(/\s/g, '_')}.csv`
        : `EduScheduler_Schedules.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasSchedule = parsedSchedules && parsedSchedules.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                <Link href={dashboardPath}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Dashboard</span>
                </Link>
                </Button>
                <div className="grid gap-1">
                    <CardTitle className="flex items-center gap-2"><CalendarCheck /> Published Schedule</CardTitle>
                    <CardDescription>
                        This is the currently active schedule. You can search, download, or delete it.
                    </CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={() => handleDownloadCsv()} disabled={!hasSchedule}>
                    <Download className="mr-2 h-4 w-4" />
                    Download All Filtered
                </Button>
                 <DeleteScheduleDialog adminEmail={adminEmail} disabled={!hasSchedule} />
            </div>
        </div>
         {hasSchedule && (
            <div className="relative mt-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by program, year, section, subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
        )}
      </CardHeader>
      <CardContent>
        {hasSchedule ? (
            filteredSchedules.length > 0 ? (
                <div className="space-y-8">
                    {filteredSchedules.map((scheduleItem, scheduleIndex) => (
                        <Card key={scheduleIndex} className="border shadow-md">
                             <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
                                <CardTitle>{scheduleItem.programYearTitle}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadCsv(scheduleItem)}>
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Download {scheduleItem.programYearTitle}</span>
                                    </Button>
                                    <DeleteSingleScheduleDialog adminEmail={adminEmail} scheduleTitle={scheduleItem.programYearTitle} />
                                </div>
                            </CardHeader>
                            <CardContent className="overflow-x-auto p-0 md:p-6">
                                <div className="space-y-6">
                                    {scheduleItem.sections.map((sectionSchedule, sectionIndex) => (
                                        <div key={sectionIndex} className="p-6 md:p-0">
                                            <h3 className="text-lg font-semibold mb-2">{sectionSchedule.sectionName}</h3>
                                            <div className="rounded-md border">
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
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                    <p className="text-muted-foreground">No schedules match your search query.</p>
                </div>
            )
        ) : (
             <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                <p className="text-muted-foreground">No schedule has been published yet.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
