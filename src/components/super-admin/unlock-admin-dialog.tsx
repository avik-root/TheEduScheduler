
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
import { unlockAdminAccount, type Admin } from '@/lib/admin';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UnlockAdminDialogProps {
  admin: Admin;
}

export function UnlockAdminDialog({ admin }: UnlockAdminDialogProps) {
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
            description: 'Please enter the security key to unlock the admin account.'
        });
        return;
    }

    setIsLoading(true);
    const result = await unlockAdminAccount(admin.email, securityKey);

    if (result.success) {
      toast({
        title: 'Account Unlocked',
        description: `The account for ${admin.name} has been unlocked.`,
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
          <AlertDialogTitle>Unlock Admin Account</AlertDialogTitle>
          <AlertDialogDescription>
            To unlock the account for <span className="font-semibold text-foreground">{admin.name}</span>, please enter the admin security key. This will reset their 2FA attempts.
          </AlertDialogDescription>
        </AlertDialogHeader>
         <div className="space-y-2 pt-2">
            <Label htmlFor={`unlock-key-${admin.email}`}>
                Admin Security Key
            </Label>
            <Input
              id={`unlock-key-${admin.email}`}
              type='password'
              placeholder="Enter admin security key"
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
