
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
import { EditSectionForm } from '@/components/admin/departments/programs/years/sections/edit-section-form';
import type { Section } from '@/lib/departments';
import { FilePenLine } from 'lucide-react';

interface EditSectionDialogProps {
  departmentId: string;
  programId: string;
  yearId: string;
  section: Section;
}

export function EditSectionDialog({ departmentId, programId, yearId, section }: EditSectionDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FilePenLine className="h-4 w-4" />
          <span className="sr-only">Edit Section</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
          <DialogDescription>
            Modify the details for {section.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditSectionForm departmentId={departmentId} programId={programId} yearId={yearId} section={section} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
