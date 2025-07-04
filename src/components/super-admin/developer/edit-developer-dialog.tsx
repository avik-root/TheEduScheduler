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
import { EditDeveloperForm } from '@/components/super-admin/developer/edit-developer-form';
import type { Developer } from '@/lib/developer';
import { FilePenLine } from 'lucide-react';

interface EditDeveloperDialogProps {
  developer: Developer;
}

export function EditDeveloperDialog({ developer }: EditDeveloperDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FilePenLine className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Developer Profile</DialogTitle>
          <DialogDescription>
            Modify the details for {developer.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditDeveloperForm developer={developer} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
