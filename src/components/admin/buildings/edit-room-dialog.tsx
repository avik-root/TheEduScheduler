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
import { EditRoomForm } from '@/components/admin/buildings/edit-room-form';
import type { Room } from '@/lib/buildings';
import { FilePenLine } from 'lucide-react';

interface EditRoomDialogProps {
  buildingId: string;
  room: Room;
}

export function EditRoomDialog({ buildingId, room }: EditRoomDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FilePenLine className="h-4 w-4" />
          <span className="sr-only">Edit Room</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>
            Modify the details for {room.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditRoomForm buildingId={buildingId} room={room} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
