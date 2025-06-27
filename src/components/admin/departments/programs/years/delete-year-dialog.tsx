
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

import { deleteYear, type Year } from '@/lib/departments';
import { useToast } from '@/hooks/use-toast';

interface DeleteYearDialogProps {
  departmentId: string;
  programId: string;
  year: Year;
  variant?: "button" | "icon";
  onSuccessRedirect?: string;
  adminEmail: string;
}

export function DeleteYearDialog({ departmentId, programId, year, variant = "icon", onSuccessRedirect, adminEmail }: DeleteYearDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    setIsLoading(true);
    const result = await deleteYear(adminEmail, departmentId, programId, year.id);

    if (result.success) {
      toast({
        title: 'Year Deleted',
        description: `The year "${year.name}" has been successfully deleted.`,
      });
      setOpen(false);
      if (onSuccessRedirect) {
        router.push(onSuccessRedirect);
      }
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
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="h-5 w-5" />
            <span className="sr-only">Delete Year</span>
          </Button>
        ) : (
           <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Year
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the year{' '}
            <span className="font-semibold text-foreground">
              {year.name}
            </span>
            {' '}and all its associated sections.
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
