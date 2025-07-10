
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UpcomingClass } from './upcoming-classes';

interface ConductStatusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    classes: UpcomingClass[];
}

export function ConductStatusDialog({ open, onOpenChange, title, classes }: ConductStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            A list of the classes you have marked as '{title.toLowerCase()}'.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            {classes.length > 0 ? (
                <ScrollArea className="h-72">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Class Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.map((c) => (
                                <TableRow key={c.key}>
                                    <TableCell className="font-medium whitespace-nowrap">{c.time}</TableCell>
                                    <TableCell>
                                        <div className="font-semibold">{c.subject}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {c.programYear} / {c.section} / Room: {c.room}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            ) : (
                <div className="flex h-24 items-center justify-center rounded-lg border bg-muted">
                    <p className="text-muted-foreground">No classes to display.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
