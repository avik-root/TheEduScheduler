
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
import { CreateProgramForm } from '@/components/admin/departments/programs/create-program-form';
import { PlusCircle } from 'lucide-react';

interface CreateProgramDialogProps {
    departmentId: string;
}

export function CreateProgramDialog({ departmentId }: CreateProgramDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Program
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Program</DialogTitle>
          <DialogDescription>
            Provide the name for the new academic program.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <CreateProgramForm departmentId={departmentId} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
