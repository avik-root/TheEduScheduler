'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, CalendarCheck, ChevronLeft, Search, Trash2, Share, Save } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { DeleteScheduleDialog } from './delete-schedule-dialog';
import { DeleteSingleScheduleDialog } from './delete-single-schedule-dialog';
import { useToast } from '@/hooks/use-toast';
import { publishSchedule } from '@/lib/schedule';
import { cn } from '@/lib/utils';

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

function schedulesToMarkdown(schedules: ParsedSchedule[]): string {
    return schedules.map(schedule => {
        let markdown = `## ${schedule.programYearTitle}\n\n`;
        schedule.sections.forEach(section => {
            markdown += `### ${section.sectionName}\n`;
            const header = `| ${section.header.join(' | ')} |`;
            const separator = `|${section.header.map(() => '-----------').join('|')}|`;
            markdown += `${header}\n${separator}\n`;
            section.rows.forEach(row => {
                const rowContent = `| ${row.join(' | ')} |`;
                markdown += `${rowContent}\n`;
            });
            markdown += '\n';
        });
        return markdown;
    }).join('\n');
}

export function ScheduleViewer({ schedule, adminEmail }: ScheduleViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { toast } = useToast();
  const [parsedSchedules, setParsedSchedules] = React.useState(() => parseMultipleSchedules(schedule));
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingCell, setEditingCell] = React.useState<{scheduleIndex: number, sectionIndex: number, rowIndex: number, cellIndex: number} | null>(null);
  const dashboardPath = `/admin/dashboard?email=${adminEmail}`;

  React.useEffect(() => {
    setParsedSchedules(parseMultipleSchedules(schedule));
    setIsDirty(false);
  }, [schedule]);

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

  const handleCellChange = (scheduleIndex: number, sectionIndex: number, rowIndex: number, cellIndex: number, value: string) => {
    setParsedSchedules(prev => {
        if (!prev) return null;
        const newSchedules = JSON.parse(JSON.stringify(prev));
        newSchedules[scheduleIndex].sections[sectionIndex].rows[rowIndex][cellIndex] = value;
        return newSchedules;
    });
    setIsDirty(true);
  };

  const handleSaveAndPublish = async () => {
    if (!parsedSchedules) return;
    setIsSaving(true);
    const newMarkdown = schedulesToMarkdown(parsedSchedules);
    const result = await publishSchedule(adminEmail, newMarkdown);
    if (result.success) {
        toast({
            title: "Schedule Updated",
            description: "Your changes have been published successfully."
        });
        setIsDirty(false);
    } else {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: result.message,
        });
    }
    setIsSaving(false);
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
                        This is the currently active schedule. Click on any cell to edit it.
                    </CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleSaveAndPublish} disabled={!isDirty || isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save & Publish Changes"}
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
                                     <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Share className="h-4 w-4" />
                                        <span className="sr-only">Share {scheduleItem.programYearTitle}</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                                                    const isEditing = editingCell?.scheduleIndex === scheduleIndex &&
                                                                                      editingCell?.sectionIndex === sectionIndex &&
                                                                                      editingCell?.rowIndex === rowIndex &&
                                                                                      editingCell?.cellIndex === cellIndex;
                                                                    return (
                                                                        <TableCell 
                                                                            key={cellIndex} 
                                                                            className={cn("whitespace-nowrap cursor-pointer hover:bg-muted/50", cellIndex === 0 && "font-medium")}
                                                                            onClick={() => {
                                                                                if (cellIndex > 0) { // Don't edit Day column
                                                                                    setEditingCell({scheduleIndex, sectionIndex, rowIndex, cellIndex});
                                                                                }
                                                                            }}
                                                                        >
                                                                            {isEditing ? (
                                                                                <Input
                                                                                    autoFocus
                                                                                    defaultValue={cell}
                                                                                    onBlur={(e) => {
                                                                                        handleCellChange(scheduleIndex, sectionIndex, rowIndex, cellIndex, e.target.value);
                                                                                        setEditingCell(null);
                                                                                    }}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') {
                                                                                            handleCellChange(scheduleIndex, sectionIndex, rowIndex, cellIndex, e.currentTarget.value);
                                                                                            setEditingCell(null);
                                                                                        } else if (e.key === 'Escape') {
                                                                                            setEditingCell(null);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                cell
                                                                            )}
                                                                        </TableCell>
                                                                    );
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
