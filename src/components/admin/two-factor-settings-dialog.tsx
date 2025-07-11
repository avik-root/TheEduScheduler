
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
import { TwoFactorSettingsForm } from './two-factor-settings-form';
import type { Admin } from '@/lib/admin';
import { ShieldCheck } from 'lucide-react';

interface TwoFactorSettingsDialogProps {
  admin: Admin;
}

export function TwoFactorSettingsDialog({ admin }: TwoFactorSettingsDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Security Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <TwoFactorSettingsForm admin={admin} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
