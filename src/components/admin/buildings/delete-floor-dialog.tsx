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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { deleteFloor } from '@/lib/buildings';
import { useToast } from '@/hooks/use-toast';

interface DeleteFloorDialogProps {
  buildingId: string;
  floorId: string;
  adminEmail: string;
}

export function DeleteFloorDialog({ buildingId, floorId, adminEmail }: DeleteFloorDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    setIsLoading(true);
    const result = await deleteFloor(adminEmail, buildingId, floorId);

    if (result.success) {
      toast({
        title: 'Floor Deleted',
        description: `The floor has been successfully deleted.`,
      });
      setOpen(false);
      
      const redirectPath = `/admin/dashboard/buildings/${buildingId}`;
      const finalRedirectPath = `${redirectPath}?email=${adminEmail}`;

      router.push(finalRedirectPath);
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: result.message,
      });
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Floor
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the floor
            and all of its associated rooms.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
