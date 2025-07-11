
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
import { Loader2, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { unlockFacultyAccount, type Faculty } from '@/lib/faculty';
import { useToast } from '@/hooks/use-toast';

interface UnlockFacultyDialogProps {
  faculty: Faculty;
  adminEmail: string;
}

export function UnlockFacultyDialog({ faculty, adminEmail }: UnlockFacultyDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleUnlock() {
    setIsLoading(true);
    const result = await unlockFacultyAccount(adminEmail, faculty.email);

    if (result.success) {
      toast({
        title: 'Account Unlocked',
        description: `The account for ${faculty.name} has been unlocked.`,
      });
      setOpen(false);
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Unlock Failed',
        description: result.message,
      });
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
            <KeyRound className="mr-2 h-4 w-4" />
            Unlock
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to unlock this account?</AlertDialogTitle>
          <AlertDialogDescription>
            This will reset the faculty member&apos;s 2FA attempts and allow them to try logging in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnlock}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unlock Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
