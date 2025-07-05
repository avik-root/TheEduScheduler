
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

interface ParsedSchedule {
  header: string[];
  rows: string[][];
}

function parseMarkdownTable(markdown: string): ParsedSchedule | null {
  if (!markdown || !markdown.includes('|')) {
    return null;
  }

  const lines = markdown.trim().split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 2) return null; // Header and separator needed

  const headerLine = lines[0];
  const separatorLine = lines[1];

  // Basic validation for markdown table format
  if (!headerLine.includes('|') || !separatorLine.includes('|--')) {
      return null;
  }
  
  const header = headerLine.split('|').map(h => h.trim()).filter(Boolean);
  const rows = lines.slice(2).map(line => 
      line.split('|').map(cell => cell.trim()).filter(Boolean)
  );

  // Filter out rows that don't match header length
  const validRows = rows.filter(row => row.length === header.length);

  return { header, rows: validRows };
}

export function ScheduleViewer({ schedule, adminEmail }: ScheduleViewerProps) {
  const parsedSchedule = React.useMemo(() => parseMarkdownTable(schedule), [schedule]);
  const dashboardPath = `/admin/dashboard?email=${adminEmail}`;


  const handleDownloadPdf = () => {
    if (!parsedSchedule) return;
    
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Published Schedule", 14, 15);
    doc.autoTable({
      head: [parsedSchedule.header],
      body: parsedSchedule.rows,
      startY: 20,
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
            <Button onClick={handleDownloadPdf} disabled={!parsedSchedule}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {parsedSchedule ? (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {parsedSchedule.header.map((head, index) => (
                                <TableHead key={index}>{head}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parsedSchedule.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex} className="whitespace-nowrap">{cell}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
