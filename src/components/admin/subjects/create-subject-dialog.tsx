
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
} from "@/components/ui/dialog";
import { CreateSubjectForm } from '@/components/admin/subjects/create-subject-form';
import { PlusCircle } from 'lucide-react';
import type { Department } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';

interface CreateSubjectDialogProps {
  adminEmail: string;
  departments: Department[];
  faculty: Faculty[];
}

export function CreateSubjectDialog({ adminEmail, departments, faculty }: CreateSubjectDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>
            Provide the details for the new subject.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <CreateSubjectForm onSuccess={() => setOpen(false)} adminEmail={adminEmail} departments={departments} faculty={faculty} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
