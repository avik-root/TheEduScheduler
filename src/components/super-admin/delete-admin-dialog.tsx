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
import { Loader2, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { deleteAdmin, type Admin } from '@/lib/admin';
import { useToast } from '@/hooks/use-toast';

interface DeleteAdminDialogProps {
  admin: Admin;
}

export function DeleteAdminDialog({ admin }: DeleteAdminDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (!open) {
      setPassword('');
      setIsLoading(false);
      setShowPassword(false);
    }
  }, [open]);

  async function handleDelete() {
    if (!password) {
      toast({
        variant: 'destructive',
        title: 'Password Required',
        description: "Please enter the admin's password to delete.",
      });
      return;
    }

    setIsLoading(true);
    const result = await deleteAdmin(admin.email, password);

    if (result.success) {
      toast({
        title: 'Admin Deleted',
        description: `The account for ${admin.name} has been successfully deleted.`,
      });
      setOpen(false);
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
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-5 w-5" />
          <span className="sr-only">Delete Admin</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the admin
            account for{' '}
            <span className="font-semibold text-foreground">
              {admin.name} ({admin.email})
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 pt-2">
          <Label htmlFor={`delete-password-${admin.email}`}>
            Enter Admin's Password to Confirm
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={`delete-password-${admin.email}`}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
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
