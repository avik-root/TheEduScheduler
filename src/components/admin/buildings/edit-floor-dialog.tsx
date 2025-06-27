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
import { EditFloorForm } from '@/components/admin/buildings/edit-floor-form';
import type { Floor } from '@/lib/buildings';
import { FilePenLine } from 'lucide-react';

interface EditFloorDialogProps {
  buildingId: string;
  floor: Floor;
}

export function EditFloorDialog({ buildingId, floor }: EditFloorDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FilePenLine className="mr-2 h-4 w-4" />
          Edit Floor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Floor</DialogTitle>
          <DialogDescription>
            Modify the details for {floor.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditFloorForm buildingId={buildingId} floor={floor} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
