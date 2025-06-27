
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
import { CreateYearForm } from '@/components/admin/departments/programs/years/create-year-form';
import { PlusCircle } from 'lucide-react';

interface CreateYearDialogProps {
    departmentId: string;
    programId: string;
}

export function CreateYearDialog({ departmentId, programId }: CreateYearDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Year(s)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Years</DialogTitle>
          <DialogDescription>
            Add one or more academic years to the program.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <CreateYearForm departmentId={departmentId} programId={programId} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
