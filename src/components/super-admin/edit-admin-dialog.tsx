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
import { EditAdminForm } from '@/components/super-admin/edit-admin-form';
import type { Admin } from '@/lib/admin';
import { FilePenLine } from 'lucide-react';

interface EditAdminDialogProps {
  admin: Admin;
}

export function EditAdminDialog({ admin }: EditAdminDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FilePenLine className="h-5 w-5" />
          <span className="sr-only">Edit Admin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Admin Account</DialogTitle>
          <DialogDescription>
            Modify the details for {admin.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditAdminForm admin={admin} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
