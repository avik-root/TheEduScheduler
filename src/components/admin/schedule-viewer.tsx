
'use client';

import * as React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, CalendarCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

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


function parseMultiSectionSchedule(markdown: string): SectionSchedule[] {
    if (!markdown || markdown.trim() === '') {
        return [];
    }

    const sections = markdown.trim().split(/###\s*(.*?)\s*\n/g).filter(Boolean);
    const parsedSchedules: SectionSchedule[] = [];

    for (let i = 0; i < sections.length; i += 2) {
        const sectionName = sections[i].trim().replace(/###\s*/, '');
        const tableMarkdown = sections[i + 1];

        if (!tableMarkdown || !tableMarkdown.includes('|')) continue;

        const lines = tableMarkdown.trim().split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) continue;

        const headerLine = lines[0];
        const separatorLine = lines[1];
        if (!headerLine.includes('|') || !separatorLine.includes('|--')) continue;

        const header = headerLine.split('|').map(h => h.trim()).filter(Boolean);
        const rows = lines.slice(2).map(line => 
            line.split('|').map(cell => cell.trim()).filter(Boolean)
        ).filter(row => row.length === header.length);

        if (header.length > 0 && rows.length > 0) {
            parsedSchedules.push({ sectionName, header, rows });
        }
    }

    return parsedSchedules;
}


export function ScheduleViewer({ schedule, adminEmail }: ScheduleViewerProps) {
  const parsedSchedules = React.useMemo(() => parseMultiSectionSchedule(schedule), [schedule]);
  const dashboardPath = `/admin/dashboard?email=${adminEmail}`;


  const handleDownloadPdf = () => {
    if (!parsedSchedules || parsedSchedules.length === 0) return;
    
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Published Schedules", 14, 15);

    let startY = 20;

    parsedSchedules.forEach((sectionSchedule, index) => {
        if (index > 0) {
            startY = (doc as any).lastAutoTable.finalY + 15;
            if (startY > 180) { // Check if new page is needed
                doc.addPage();
                startY = 20;
            }
        }
        
        doc.text(sectionSchedule.sectionName, 14, startY);

        doc.autoTable({
            head: [sectionSchedule.header],
            body: sectionSchedule.rows,
            startY: startY + 5,
        });
    });

    doc.save('published-schedule.pdf');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
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
                        This is the currently active schedule for the faculty. You can download it as a PDF.
                    </CardDescription>
                </div>
            </div>
            <Button onClick={handleDownloadPdf} disabled={!parsedSchedules || parsedSchedules.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {parsedSchedules && parsedSchedules.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {parsedSchedules.map((sectionSchedule, sectionIndex) => (
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
                <p className="text-muted-foreground">No schedule has been published yet.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
