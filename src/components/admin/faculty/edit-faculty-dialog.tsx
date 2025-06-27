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
import { EditFacultyForm } from '@/components/admin/faculty/edit-faculty-form';
import type { Faculty } from '@/lib/faculty';
import { FilePenLine } from 'lucide-react';
import type { Department } from '@/lib/departments';

interface EditFacultyDialogProps {
  faculty: Faculty;
  departments: Department[];
  adminEmail: string;
}

export function EditFacultyDialog({ faculty, departments, adminEmail }: EditFacultyDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FilePenLine className="h-5 w-5" />
          <span className="sr-only">Edit Faculty</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Faculty Account</DialogTitle>
          <DialogDescription>
            Modify the details for {faculty.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditFacultyForm faculty={faculty} onSuccess={() => setOpen(false)} departments={departments} adminEmail={adminEmail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
