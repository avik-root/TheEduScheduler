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
import { EditBuildingForm } from '@/components/admin/buildings/edit-building-form';
import type { Building } from '@/lib/buildings';
import { FilePenLine } from 'lucide-react';

interface EditBuildingDialogProps {
  building: Building;
  adminEmail: string;
}

export function EditBuildingDialog({ building, adminEmail }: EditBuildingDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FilePenLine className="h-5 w-5" />
          <span className="sr-only">Edit Building</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Building</DialogTitle>
          <DialogDescription>
            Modify the details for {building.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditBuildingForm building={building} onSuccess={() => setOpen(false)} adminEmail={adminEmail} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
