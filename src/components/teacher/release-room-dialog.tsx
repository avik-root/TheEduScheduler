
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BellRing } from 'lucide-react';
import type { UpcomingClass } from './upcoming-classes';
import { Button } from '../ui/button';

interface ReleaseRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classDetails: UpcomingClass;
  onConfirm: (releaseRoom: boolean) => void;
}

export function ReleaseRoomDialog({ open, onOpenChange, classDetails, onConfirm }: ReleaseRoomDialogProps) {
  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Confirm Class Cancellation
          </AlertDialogTitle>
          <div className="text-sm text-muted-foreground pt-2">
            <p>You are marking the following class as 'Not Conducted':</p>
            <div className="my-2 rounded-md border bg-muted p-3 text-sm text-foreground">
              <strong>{classDetails.subject}</strong> at {classDetails.time} in {classDetails.room}
            </div>
            <p>Would you like to release the room for this time slot, making it available for other faculty to request?</p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="secondary" onClick={() => onConfirm(false)}>
            Just Cancel Class
          </Button>
          <AlertDialogAction onClick={() => onConfirm(true)}>
            Release Room & Cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
