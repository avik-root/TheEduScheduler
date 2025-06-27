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
    floorId: string;
}

export function AddRoomDialog({ buildingId, floorId }: AddRoomDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Room(s)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Rooms</DialogTitle>
          <DialogDescription>
            Create multiple rooms at once using a prefix and a number range.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <AddRoomForm buildingId={buildingId} floorId={floorId} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
