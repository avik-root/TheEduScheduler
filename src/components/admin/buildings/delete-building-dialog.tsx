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
import { usePathname } from 'next/navigation';


import { deleteBuilding } from '@/lib/buildings';
import { useToast } from '@/hooks/use-toast';

interface DeleteBuildingDialogProps {
  buildingId: string;
  adminEmail: string;
}

export function DeleteBuildingDialog({ buildingId, adminEmail }: DeleteBuildingDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  async function handleDelete() {
    setIsLoading(true);
    const result = await deleteBuilding(adminEmail, buildingId);

    if (result.success) {
      toast({
        title: 'Building Deleted',
        description: `The building has been successfully deleted.`,
      });
      setOpen(false);

      const pathSegments = pathname.split('/');
      const buildingsIndex = pathSegments.indexOf('buildings');
      const redirectPath = pathSegments.slice(0, buildingsIndex + 1).join('/');
      
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
            Delete Building
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the building
            and all of its associated floors and rooms.
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
