
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
import { EditProgramForm } from '@/components/admin/departments/programs/edit-program-form';
import type { Program } from '@/lib/departments';
import { FilePenLine } from 'lucide-react';

interface EditProgramDialogProps {
  departmentId: string;
  program: Program;
}

export function EditProgramDialog({ departmentId, program }: EditProgramDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FilePenLine className="h-5 w-5" />
          <span className="sr-only">Edit Program</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Program</DialogTitle>
          <DialogDescription>
            Modify the name for {program.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditProgramForm departmentId={departmentId} program={program} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
