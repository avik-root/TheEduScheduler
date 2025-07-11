
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Faculty } from '@/lib/faculty';
import { setTwoFactor } from '@/lib/faculty';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

const TwoFactorSettingsSchema = z.object({
  isEnabled: z.boolean(),
  pin: z.string().optional(),
  currentPassword: z.string().min(1, { message: 'Your current password is required to save changes.' }),
}).refine(data => {
    if (data.isEnabled && (!data.pin || data.pin.length !== 6 || !/^\d+$/.test(data.pin))) {
        return false;
    }
    return true;
}, {
    message: "A 6-digit PIN is required to enable 2FA.",
    path: ["pin"],
});


type FormData = z.infer<typeof TwoFactorSettingsSchema>;

interface TwoFactorSettingsDialogProps {
    faculty: Faculty;
    adminEmail: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function TwoFactorSettingsDialog({ faculty, adminEmail, open, onOpenChange }: TwoFactorSettingsDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPin, setShowPin] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange : setInternalOpen;


  const form = useForm<FormData>({
    resolver: zodResolver(TwoFactorSettingsSchema),
    defaultValues: {
      isEnabled: faculty.isTwoFactorEnabled || false,
      pin: '',
      currentPassword: '',
    },
  });

  const isEnabled = form.watch('isEnabled');
  
  // Reset form when dialog opens
    React.useEffect(() => {
        if (dialogOpen) {
            form.reset({
                isEnabled: faculty.isTwoFactorEnabled || false,
                pin: '',
                currentPassword: '',
            });
        }
    }, [dialogOpen, form, faculty.isTwoFactorEnabled]);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const result = await setTwoFactor({
        adminEmail,
        facultyEmail: faculty.email,
        ...data,
    });

    if (result.success) {
      toast({
        title: 'Security Settings Updated',
        description: 'Your 2FA settings have been saved.',
      });
      router.refresh();
      setDialogOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.message,
      });
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Two-Factor Authentication
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="isEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable 2FA</FormLabel>
                                <FormDescription>
                                    When enabled, you will be required to enter a 6-digit PIN after logging in.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {isEnabled && (
                     <FormField
                        control={form.control}
                        name="pin"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>New 6-Digit PIN</FormLabel>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input 
                                        type={showPin ? 'text' : 'password'}
                                        placeholder="••••••" 
                                        {...field} 
                                        maxLength={6} 
                                        pattern="\d{6}"
                                        autoComplete="off"
                                        className="pl-10 pr-10"
                                    />
                                </FormControl>
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                                >
                                    <span className="sr-only">{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Current Password (Required)</FormLabel>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                           <FormControl>
                                <Input type={showPassword ? 'text' : 'password'} {...field} placeholder="Enter password to confirm" className="pl-10 pr-10" />
                           </FormControl>
                           <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                            >
                                <span className="sr-only">{showPassword ? 'Hide Password' : 'Show Password'}</span>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
