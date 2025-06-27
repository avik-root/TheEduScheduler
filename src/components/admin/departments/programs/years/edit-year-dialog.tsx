
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EditYearForm } from '@/components/admin/departments/programs/years/edit-year-form';
import type { Year } from '@/lib/departments';
import { FilePenLine } from 'lucide-react';

interface EditYearDialogProps {
  departmentId: string;
  programId: string;
  year: Year;
  variant?: "button" | "icon";
  adminEmail: string;
}

export function EditYearDialog({ departmentId, programId, year, variant = "icon", adminEmail }: EditYearDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon">
            <FilePenLine className="h-5 w-5" />
            <span className="sr-only">Edit Year</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <FilePenLine className="mr-2 h-4 w-4" />
            Edit Year
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Year</DialogTitle>
          <DialogDescription>
            Modify the name for {year.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditYearForm departmentId={departmentId} programId={programId} year={year} onSuccess={() => setOpen(false)} adminEmail={adminEmail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
