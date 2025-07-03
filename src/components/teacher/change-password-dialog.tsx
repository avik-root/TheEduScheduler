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
import { ChangePasswordForm } from '@/components/teacher/change-password-form';
import { Lock } from 'lucide-react';

interface ChangePasswordDialogProps {
  facultyEmail: string;
  adminEmail: string;
}

export function ChangePasswordDialog({ facultyEmail, adminEmail }: ChangePasswordDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Lock className="mr-2 h-4 w-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Your Password</DialogTitle>
          <DialogDescription>
            Enter your current password and a new password to update your account.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <ChangePasswordForm onSuccess={() => setOpen(false)} facultyEmail={facultyEmail} adminEmail={adminEmail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
