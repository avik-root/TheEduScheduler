
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UnlockFacultyDialogProps {
  faculty: Faculty;
  adminEmail: string;
}

export function UnlockFacultyDialog({ faculty, adminEmail }: UnlockFacultyDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [securityKey, setSecurityKey] = React.useState('');
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (!open) {
        setSecurityKey('');
    }
  }, [open]);

  async function handleUnlock() {
    if (!securityKey) {
        toast({
            variant: 'destructive',
            title: 'Key Required',
            description: 'Please enter the faculty security key to unlock the account.'
        });
        return;
    }

    setIsLoading(true);
    const result = await unlockFacultyAccount(adminEmail, faculty.email, securityKey);

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
    }
    setIsLoading(false);
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
          <AlertDialogTitle>Unlock Faculty Account</AlertDialogTitle>
          <AlertDialogDescription>
            To unlock the account for <span className="font-semibold text-foreground">{faculty.name}</span>, please enter the faculty security key. This will reset their 2FA attempts and allow them to log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
         <div className="space-y-2 pt-2">
            <Label htmlFor={`unlock-key-${faculty.email}`}>
                Security Key
            </Label>
            <Input
              id={`unlock-key-${faculty.email}`}
              type='password'
              placeholder="Enter faculty security key"
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value)}
            />
        </div>
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
