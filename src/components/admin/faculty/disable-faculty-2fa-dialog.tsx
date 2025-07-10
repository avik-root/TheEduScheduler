
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldOff, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { disableFaculty2FA, type Faculty } from '@/lib/faculty';
import { useToast } from '@/hooks/use-toast';

interface DisableFaculty2FADialogProps {
  faculty: Faculty;
  adminEmail: string;
  onSuccess?: () => void;
}

export function DisableFaculty2FADialog({ faculty, adminEmail, onSuccess }: DisableFaculty2FADialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [key, setKey] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (!open) {
      setKey('');
      setIsLoading(false);
    }
  }, [open]);

  async function handleDisable() {
    if (!key) {
      toast({
        variant: 'destructive',
        title: 'Key Required',
        description: "Please enter the 2FA disable key.",
      });
      return;
    }

    setIsLoading(true);
    const result = await disableFaculty2FA(adminEmail, faculty.email, key);

    if (result.success) {
      toast({
        title: '2FA Disabled',
        description: `Two-factor authentication has been disabled for ${faculty.name}.`,
      });
      setOpen(false);
      onSuccess?.();
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: result.message,
      });
    }
    setIsLoading(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
            <ShieldOff className="mr-2 h-4 w-4" />
            Disable 2FA
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently disable Two-Factor Authentication for{' '}
            <span className="font-semibold text-foreground">
              {faculty.name}
            </span>
            {' '}and unlock their account. This action requires the 256-bit security key.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 pt-2">
          <Label htmlFor={`disable-key-${faculty.email}`}>
            Enter 2FA Disable Key
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={`disable-key-${faculty.email}`}
              type="text"
              placeholder="Enter the 256-bit security key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <AlertDialogFooter className="pt-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDisable}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Disable
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
