
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
import { EditLogoForm } from '@/components/super-admin/logo/edit-logo-form';
import { FilePenLine } from 'lucide-react';

interface EditLogoDialogProps {
  currentLogo: string | null;
}

export function EditLogoDialog({ currentLogo }: EditLogoDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FilePenLine className="h-4 w-4 mr-2" />
          Change Logo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Application Logo</DialogTitle>
          <DialogDescription>
            Upload a new logo for the application. The image must be a PNG file.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditLogoForm currentLogo={currentLogo} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
