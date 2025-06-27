
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
import { useRouter, usePathname } from 'next/navigation';

import { deleteDepartment, type Department } from '@/lib/departments';
import { useToast } from '@/hooks/use-toast';

interface DeleteDepartmentDialogProps {
  department: Department;
  adminEmail: string;
}

export function DeleteDepartmentDialog({ department, adminEmail }: DeleteDepartmentDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  async function handleDelete() {
    setIsLoading(true);
    const result = await deleteDepartment(adminEmail, department.id);

    if (result.success) {
      toast({
        title: 'Department Deleted',
        description: `The department "${department.name}" has been successfully deleted.`,
      });
      setOpen(false);

      const pathSegments = pathname.split('/');
      const departmentsIndex = pathSegments.indexOf('departments');
      if (departmentsIndex > -1) {
        const redirectPath = pathSegments.slice(0, departmentsIndex + 1).join('/');
        const finalRedirectPath = `${redirectPath}?email=${adminEmail}`;
        router.push(finalRedirectPath);
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
        <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Department
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the{' '}
            <span className="font-semibold text-foreground">
              {department.name}
            </span>
            {' '}department and all of its associated programs.
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
