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
import { CreateFloorForm } from '@/components/admin/buildings/create-floor-form';
import { PlusCircle } from 'lucide-react';

interface CreateFloorDialogProps {
    buildingId: string;
}

export function CreateFloorDialog({ buildingId }: CreateFloorDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Floors
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Floors</DialogTitle>
          <DialogDescription>
            Add one or more floors to the building.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
            <CreateFloorForm buildingId={buildingId} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
