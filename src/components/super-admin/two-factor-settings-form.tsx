
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Admin } from '@/lib/admin';
import { setSuperAdminTwoFactor } from '@/lib/super-admin';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { SuperAdmin2FASchema } from '@/lib/validators/auth';
import { Button } from '@/components/ui/button';

type FormData = z.infer<typeof SuperAdmin2FASchema>;

interface TwoFactorSettingsFormProps {
    superAdmin: Admin;
    onSuccess?: () => void;
}

export function TwoFactorSettingsForm({ superAdmin, onSuccess }: TwoFactorSettingsFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPin, setShowPin] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(SuperAdmin2FASchema),
    defaultValues: {
      isEnabled: superAdmin.isTwoFactorEnabled || false,
      pin: '',
      currentPassword: '',
    },
  });

  const isEnabled = form.watch('isEnabled');

  React.useEffect(() => {
    form.reset({
      isEnabled: superAdmin.isTwoFactorEnabled || false,
      pin: '',
      currentPassword: '',
    });
  }, [superAdmin.isTwoFactorEnabled, form]);


  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const result = await setSuperAdminTwoFactor(data);

    if (result.success) {
      toast({
        title: 'Security Settings Updated',
        description: 'Your 2FA settings have been saved.',
      });
      router.refresh();
      onSuccess?.();
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
                            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4" />}
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
  );
}
