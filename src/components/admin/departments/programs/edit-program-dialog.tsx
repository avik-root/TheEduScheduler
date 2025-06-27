
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
  variant?: "button" | "icon";
  adminEmail: string;
}

export function EditProgramDialog({ departmentId, program, variant = "icon", adminEmail }: EditProgramDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon">
            <FilePenLine className="h-5 w-5" />
            <span className="sr-only">Edit Program</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <FilePenLine className="mr-2 h-4 w-4" />
            Edit Program
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Program</DialogTitle>
          <DialogDescription>
            Modify the name for {program.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditProgramForm departmentId={departmentId} program={program} onSuccess={() => setOpen(false)} adminEmail={adminEmail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
