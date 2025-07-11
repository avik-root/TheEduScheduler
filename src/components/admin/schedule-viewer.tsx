'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, CalendarCheck, ChevronLeft, Search, Trash2, Share, FilePenLine, X, Loader2, Upload, Check } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { DeleteScheduleDialog } from './delete-schedule-dialog';
import { DeleteSingleScheduleDialog } from './delete-single-schedule-dialog';
import { useToast } from '@/hooks/use-toast';
import { ScheduleCheckerDialog } from './schedule-checker-dialog';
import type { Department, Faculty, Subject, Room } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { publishSchedule } from '@/lib/schedule';


interface ScheduleViewerProps {
  initialSchedule: string;
  adminEmail: string;
  departments: Department[];
  faculty: Faculty[];
  subjects: Subject[];
  allRooms: Room[];
}

export interface SectionSchedule {
  sectionName: string;
  header: string[];
  rows: (string | ParsedCell)[][];
}

export interface ParsedCell {
    subject: string;
    faculty: string;
    room: string;
}

export interface ParsedSchedule {
    programYearTitle: string;
    sections: SectionSchedule[];
}

function parseCell(cell: string): string | ParsedCell {
    if (cell === '-' || cell.toLowerCase().includes('break')) {
        return cell;
    }
    const match = cell.match(/(.+) \((.+)\) in (.+)/);
    if (match) {
        return {
            subject: match[1].trim(),
            faculty: match[2].trim(),
            room: match[3].trim()
        };
    }
    return cell;
}

export function parseMultipleSchedules(markdown: string): ParsedSchedule[] | null {
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
            ).map(row => row.map(parseCell)).filter(row => row.length === header.length);

            if (header.length > 0 && rows.length > 0) {
                parsedSections.push({ sectionName, header, rows });
            }
        }
        
        return { programYearTitle, sections: parsedSections };
    }).filter(s => s.sections.length > 0);
}

function cellToMarkdown(cell: string | ParsedCell): string {
    if (typeof cell === 'string') {
        return cell;
    }
    if (!cell.subject) return '-';
    return `${cell.subject} (${cell.faculty || 'NF'}) in ${cell.room || 'N/A'}`;
}


export function schedulesToMarkdown(schedules: ParsedSchedule[]): string {
    return schedules.map(schedule => {
        let markdown = `## ${schedule.programYearTitle}\n\n`;
        schedule.sections.forEach(section => {
            markdown += `### ${section.sectionName}\n`;
            markdown += `| ${section.header.join(' | ')} |\n`;
            markdown += `| ${section.header.map(() => '---').join(' | ')} |\n`;
            section.rows.forEach(row => {
                const rowContent = row.map(cellToMarkdown).join(' | ');
                markdown += `| ${rowContent} |\n`;
            });
            markdown += '\n';
        });
        return markdown;
    }).join('\n');
}


export function ScheduleViewer({ initialSchedule, adminEmail, departments, faculty, subjects, allRooms }: ScheduleViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [popoverOpenStates, setPopoverOpenStates] = React.useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const [schedules, setSchedules] = React.useState(() => parseMultipleSchedules(initialSchedule));
  const dashboardPath = `/admin/dashboard?email=${adminEmail}`;
  
  const setPopoverOpen = (key: string, open: boolean) => {
    setPopoverOpenStates(prev => ({ ...prev, [key]: open }));
  }

  const handleUpdateCell = (scheduleIdx: number, sectionIdx: number, rowIdx: number, cellIdx: number, newCell: Partial<ParsedCell> | null) => {
    setSchedules(prevSchedules => {
        if (!prevSchedules) return null;
        const newSchedules = [...prevSchedules];
        const currentCell = newSchedules[scheduleIdx].sections[sectionIdx].rows[rowIdx][cellIdx];

        if (newCell === null) { // Clearing the cell
             newSchedules[scheduleIdx].sections[sectionIdx].rows[rowIdx][cellIdx] = '-';
        } else {
             const updatedCell: ParsedCell = typeof currentCell === 'object' 
                ? { ...currentCell, ...newCell }
                : { subject: '', faculty: '', room: '', ...newCell };
             newSchedules[scheduleIdx].sections[sectionIdx].rows[rowIdx][cellIdx] = updatedCell;
        }
        return newSchedules;
    });
  }

  const handlePublish = async () => {
    if (!schedules) return;
    setIsLoading(true);
    const markdown = schedulesToMarkdown(schedules);
    const result = await publishSchedule(adminEmail, markdown);
    if (result.success) {
        toast({ title: 'Schedule Updated', description: 'The published schedule has been successfully updated.' });
        setIsEditing(false);
    } else {
        toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
    }
    setIsLoading(false);
  }

  const filteredSchedules = React.useMemo(() => {
    if (!schedules) return [];
    if (!searchQuery.trim()) return schedules;

    const lowercasedQuery = searchQuery.toLowerCase();
    
    return schedules.map(scheduleItem => {
        if (scheduleItem.programYearTitle.toLowerCase().includes(lowercasedQuery)) {
            return scheduleItem;
        }

        const filteredSections = scheduleItem.sections.filter(section => {
          const sectionMatches = section.sectionName.toLowerCase().includes(lowercasedQuery);
          if (sectionMatches) return true;

          const contentMatches = section.rows.some(row => 
            row.some(cell => cellToMarkdown(cell).toLowerCase().includes(lowercasedQuery))
          );
          return contentMatches;
        });

        if(filteredSections.length > 0) {
            return { ...scheduleItem, sections: filteredSections };
        }
        return null;
    }).filter((s): s is ParsedSchedule => s !== null);

  }, [schedules, searchQuery]);


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

    const formatCsvRow = (row: (string | ParsedCell)[], isHeader = false) => {
        const formattedRow = row.map((cell, index) => {
            const cellText = isHeader ? cell as string : cellToMarkdown(cell);
            const finalCell = (isHeader && index > 0) ? formatTimeRange(cellText) : cellText;
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
        ? `EduScheduler_${scheduleToDownload.programYearTitle.replace(/[^a-zA-Z0-9\\-_]/g, '_')}.csv`
        : `EduScheduler_Schedules.csv`;
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
  };
  
  const handleShare = async (scheduleToShare: ParsedSchedule) => {
    let shareText = `${scheduleToShare.programYearTitle}\n\n`;
    scheduleToShare.sections.forEach(section => {
        shareText += `Section: ${section.sectionName}\n`;
        section.rows.forEach(row => {
            const dayCell = row[0];
            if (typeof dayCell === 'string') {
                shareText += `\n${dayCell}:\n`; // Day of the week
                 row.slice(1).forEach((cell, index) => {
                    const cellText = cellToMarkdown(cell);
                    if (cellText !== '-') {
                        const timeSlot = section.header[index + 1];
                        shareText += `  - ${timeSlot}: ${cellText}\n`;
                    }
                });
            }
        });
        shareText += '\n---\n';
    });

    const shareData = {
        title: `Schedule: ${scheduleToShare.programYearTitle}`,
        text: shareText,
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
            toast({
                title: 'Shared Successfully',
                description: 'The schedule has been shared.'
            });
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Error sharing:', error);
                toast({
                    variant: 'destructive',
                    title: 'Sharing Failed',
                    description: 'There was an error while trying to share the schedule. Please try again.',
                });
            }
        }
    } else {
        toast({
            variant: 'destructive',
            title: 'Sharing Not Supported',
            description: 'Your browser or device does not support sharing this content.',
        });
    }
  };


  const hasSchedule = schedules && schedules.length > 0;

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
                        This is the currently active schedule. You can search, download, or edit it.
                    </CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <ScheduleCheckerDialog schedules={schedules || []} />
                 {isEditing ? (
                    <>
                        <Button variant="outline" onClick={() => setIsEditing(false)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                        <Button onClick={handlePublish} disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Save & Publish</Button>
                    </>
                ) : (
                    <Button onClick={() => setIsEditing(true)} disabled={!hasSchedule}><FilePenLine className="mr-2 h-4 w-4" /> Edit Schedule</Button>
                )}
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
                                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleShare(scheduleItem)}>
                                        <Share className="h-4 w-4" />
                                        <span className="sr-only">Share {scheduleItem.programYearTitle}</span>
                                    </Button>
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
                                        <div key={sectionIndex}>
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
                                                                {row.map((cell, cellIndex) => {
                                                                    const cellContent = cellToMarkdown(cell);
                                                                    const popoverKey = `${scheduleItem.programYearTitle}-${sectionSchedule.sectionName}-${rowIndex}-${cellIndex}`;

                                                                    if (cellIndex === 0 || !isEditing || typeof cell !== 'object' && (cell.toLowerCase().includes('break') || cell === '-')) {
                                                                        return <TableCell key={cellIndex} className="whitespace-nowrap">{cellContent}</TableCell>;
                                                                    }
                                                                    
                                                                    const cellValue = cell as ParsedCell;
                                                                    const program = departments.flatMap(d => d.programs).find(p => scheduleItem.programYearTitle.includes(p.name));
                                                                    const year = program?.years.find(y => scheduleItem.programYearTitle.includes(y.name));
                                                                    const yearSubjects = year ? subjects.filter(s => s.yearId === year.id) : [];


                                                                    return (
                                                                         <TableCell key={cellIndex} className="p-1">
                                                                             <Popover open={popoverOpenStates[popoverKey]} onOpenChange={(open) => setPopoverOpen(popoverKey, open)}>
                                                                                <PopoverTrigger asChild>
                                                                                    <Button variant="ghost" className="h-auto p-1 text-xs w-full justify-start text-left min-h-[52px]">
                                                                                        {cellValue.subject ? (
                                                                                            <div>
                                                                                                <p className="font-semibold">{cellValue.subject}</p>
                                                                                                <p>{cellValue.faculty}</p>
                                                                                                <p className="text-muted-foreground">{cellValue.room}</p>
                                                                                            </div>
                                                                                        ) : <span className="text-muted-foreground">Empty</span>}
                                                                                    </Button>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-64 p-0" align="start">
                                                                                    <div className="p-2 space-y-2">
                                                                                        <h4 className="font-medium text-sm">{row[0]}, {sectionSchedule.header[cellIndex]}</h4>
                                                                                        <Command><CommandInput placeholder="Search subject..." /><CommandList><CommandEmpty>No results</CommandEmpty><CommandGroup>{yearSubjects.map(s => <CommandItem key={s.id} onSelect={() => { handleUpdateCell(scheduleIndex, sectionIndex, rowIndex, cellIndex, { subject: s.code }); setPopoverOpen(popoverKey, false); }}><Check className={cn("mr-2 h-4 w-4", cellValue?.subject === s.code ? "opacity-100" : "opacity-0")} />{s.name}</CommandItem>)}</CommandGroup></CommandList></Command>
                                                                                        <Command><CommandInput placeholder="Search faculty..." /><CommandList><CommandEmpty>No results</CommandEmpty><CommandGroup>{faculty.map(f => <CommandItem key={f.email} onSelect={() => { handleUpdateCell(scheduleIndex, sectionIndex, rowIndex, cellIndex, { faculty: f.abbreviation }); setPopoverOpen(popoverKey, false);}}><Check className={cn("mr-2 h-4 w-4", cellValue?.faculty === f.abbreviation ? "opacity-100" : "opacity-0")} />{f.name}</CommandItem>)}</CommandGroup></CommandList></Command>
                                                                                        <Command><CommandInput placeholder="Search room..." /><CommandList><CommandEmpty>No results</CommandEmpty><CommandGroup>{allRooms.map(r => <CommandItem key={r.id} onSelect={() => { handleUpdateCell(scheduleIndex, sectionIndex, rowIndex, cellIndex, { room: r.name }); setPopoverOpen(popoverKey, false);}}><Check className={cn("mr-2 h-4 w-4", cellValue?.room === r.name ? "opacity-100" : "opacity-0")} />{r.name}</CommandItem>)}</CommandGroup></CommandList></Command>
                                                                                    </div>
                                                                                    <Separator />
                                                                                    <div className="p-2">
                                                                                        <Button variant="destructive" size="sm" className="w-full" onClick={() => { handleUpdateCell(scheduleIndex, sectionIndex, rowIndex, cellIndex, null); setPopoverOpen(popoverKey, false);}}>
                                                                                            <X className="mr-2 h-4 w-4"/> Clear Cell
                                                                                        </Button>
                                                                                    </div>
                                                                                </PopoverContent>
                                                                            </Popover>
                                                                        </TableCell>
                                                                    )
                                                                })}
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
