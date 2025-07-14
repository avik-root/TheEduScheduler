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
import { EditVersionForm } from '@/components/super-admin/version/edit-version-form';
import type { Version } from '@/lib/version';
import { FilePenLine } from 'lucide-react';

interface EditVersionDialogProps {
  currentVersion: Version;
}

export function EditVersionDialog({ currentVersion }: EditVersionDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FilePenLine className="h-4 w-4 mr-2" />
          Edit Version
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Application Version</DialogTitle>
          <DialogDescription>
            Update the version number and status for the entire application.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditVersionForm currentVersion={currentVersion} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
