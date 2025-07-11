
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
import { EditSubjectForm } from '@/components/admin/subjects/edit-subject-form';
import type { Subject } from '@/lib/subjects';
import { FilePenLine } from 'lucide-react';
import type { Department } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';

interface EditSubjectDialogProps {
  subject: Subject;
  adminEmail: string;
  departments: Department[];
  faculty: Faculty[];
}

export function EditSubjectDialog({ subject, adminEmail, departments, faculty }: EditSubjectDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FilePenLine className="h-5 w-5" />
          <span className="sr-only">Edit Subject</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Modify the details for {subject.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditSubjectForm subject={subject} onSuccess={() => setOpen(false)} adminEmail={adminEmail} departments={departments} faculty={faculty} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
