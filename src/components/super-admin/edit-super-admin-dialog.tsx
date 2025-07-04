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
import { EditSuperAdminForm } from '@/components/super-admin/edit-super-admin-form';
import type { Admin } from '@/lib/admin';
import { Settings } from 'lucide-react';

interface EditSuperAdminDialogProps {
  superAdmin: Admin;
}

export function EditSuperAdminDialog({ superAdmin }: EditSuperAdminDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Super Admin Settings</DialogTitle>
          <DialogDescription>
            Modify your account details here. Your current password is required to save any changes.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditSuperAdminForm superAdmin={superAdmin} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
