
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
import { AddSectionForm } from '@/components/admin/departments/programs/years/sections/add-section-form';
import { PlusCircle } from 'lucide-react';

interface AddSectionDialogProps {
    departmentId: string;
    programId: string;
    yearId: string;
    adminEmail: string;
}

export function AddSectionDialog({ departmentId, programId, yearId, adminEmail }: AddSectionDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Section(s)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Sections</DialogTitle>
          <DialogDescription>
            Create multiple sections at once using a prefix and a number range.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <AddSectionForm departmentId={departmentId} programId={programId} yearId={yearId} onSuccess={() => setOpen(false)} adminEmail={adminEmail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
