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
import { CreateFacultyForm } from '@/components/admin/faculty/create-faculty-form';
import { PlusCircle } from 'lucide-react';
import type { Department } from '@/lib/departments';

interface CreateFacultyDialogProps {
  departments: Department[];
  adminEmail: string;
}

export function CreateFacultyDialog({ departments, adminEmail }: CreateFacultyDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Faculty
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Faculty Account</DialogTitle>
          <DialogDescription>
            Provide the details for the new faculty member.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <CreateFacultyForm onSuccess={() => setOpen(false)} departments={departments} adminEmail={adminEmail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
