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
} from "@/components/ui/dialog";
import { AddRoomForm } from '@/components/admin/buildings/add-room-form';
import { PlusCircle } from 'lucide-react';

interface AddRoomDialogProps {
    buildingId: string;
}

export function AddRoomDialog({ buildingId }: AddRoomDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Provide the details for the new room.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <AddRoomForm buildingId={buildingId} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
