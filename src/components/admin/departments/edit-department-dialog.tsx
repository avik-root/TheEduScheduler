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
import { EditDepartmentForm } from '@/components/admin/departments/edit-department-form';
import type { Department } from '@/lib/departments';
import { FilePenLine } from 'lucide-react';

interface EditDepartmentDialogProps {
  department: Department;
}

export function EditDepartmentDialog({ department }: EditDepartmentDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FilePenLine className="h-5 w-5" />
          <span className="sr-only">Edit Department</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Modify the name for {department.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditDepartmentForm department={department} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
