'use client';

import * as React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, CalendarCheck, ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { DeleteScheduleDialog } from './delete-schedule-dialog';

// Extend jsPDF with autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

function parseCompleteSchedule(markdown: string): ParsedSchedule | null {
    if (!markdown || markdown.trim() === '') {
        return null;
    }

    const lines = markdown.trim().split('\n');
    let programYearTitle = "Published Schedule"; // Default title
    let scheduleContent = markdown;

    if (lines[0].startsWith('## ')) {
        programYearTitle = lines[0].substring(3).trim();
        scheduleContent = lines.slice(1).join('\n');
    }

    const sectionsMarkdown = scheduleContent.trim().split(/###\s*(.*?)\s*\n/g).filter(Boolean);
    const parsedSections: SectionSchedule[] = [];

    for (let i = 0; i < sectionsMarkdown.length; i += 2) {
        const sectionName = sectionsMarkdown[i].trim().replace(/###\s*/, '');
        const tableMarkdown = sectionsMarkdown[i + 1];

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
}


export function ScheduleViewer({ schedule, adminEmail }: ScheduleViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const parsedSchedule = React.useMemo(() => parseCompleteSchedule(schedule), [schedule]);
  const dashboardPath = `/admin/dashboard?email=${adminEmail}`;

  const filteredSections = React.useMemo(() => {
    if (!parsedSchedule) return [];
    if (!searchQuery.trim()) return parsedSchedule.sections;

    const lowercasedQuery = searchQuery.toLowerCase();
    
    return parsedSchedule.sections.filter(section => {
      const sectionMatches = section.sectionName.toLowerCase().includes(lowercasedQuery);
      if (sectionMatches) return true;

      const contentMatches = section.rows.some(row => 
        row.some(cell => cell.toLowerCase().includes(lowercasedQuery))
      );
      return contentMatches;
    });
  }, [parsedSchedule, searchQuery]);


  const handleDownloadPdf = () => {
    if (!parsedSchedule || parsedSchedule.sections.length === 0) return;
    
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(parsedSchedule.programYearTitle, 14, 15);

    let startY = 20;

    filteredSections.forEach((sectionSchedule) => {
        if (startY > 20 && (startY + sectionSchedule.rows.length * 10) > 180) { // Check if new page is needed
            doc.addPage();
            startY = 15;
        } else if (startY > 20) {
             startY = (doc as any).lastAutoTable.finalY + 15;
        }
        
        doc.text(sectionSchedule.sectionName, 14, startY);

        doc.autoTable({
            head: [sectionSchedule.header],
            body: sectionSchedule.rows,
            startY: startY + 5,
        });
    });

    doc.save(`${parsedSchedule.programYearTitle.replace(/\s/g, '_')}_filtered.pdf`);
  };

  const hasSchedule = parsedSchedule && parsedSchedule.sections.length > 0;

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
                    <CardTitle className="flex items-center gap-2"><CalendarCheck /> {parsedSchedule?.programYearTitle || 'Published Schedule'}</CardTitle>
                    <CardDescription>
                        This is the currently active schedule. You can search, download, or delete it.
                    </CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleDownloadPdf} disabled={!hasSchedule}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
                 <DeleteScheduleDialog adminEmail={adminEmail} disabled={!hasSchedule} />
            </div>
        </div>
         {hasSchedule && (
            <div className="relative mt-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by section, subject, faculty, or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
        )}
      </CardHeader>
      <CardContent>
        {hasSchedule ? (
            filteredSections.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredSections.map((sectionSchedule, sectionIndex) => (
                        <Card key={sectionIndex}>
                            <CardHeader>
                                <CardTitle>{sectionSchedule.sectionName}</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto p-0">
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                    <p className="text-muted-foreground">No sections match your search query.</p>
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
