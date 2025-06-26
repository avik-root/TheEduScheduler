'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, User, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UpdateAdminSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateAdmin, type Admin } from '@/lib/admin';

type FormData = z.infer<typeof UpdateAdminSchema>;

interface EditAdminFormProps {
  admin: Admin;
  onSuccess?: () => void;
}

export function EditAdminForm({ admin, onSuccess }: EditAdminFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(UpdateAdminSchema),
    defaultValues: {
      name: admin.name,
      email: admin.email,
      password: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await updateAdmin(data);

    if (result.success) {
      toast({
        title: 'Admin Account Updated',
        description: `The account for ${data.name} has been successfully updated.`,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Jane Smith" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Cannot be changed)</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    className="pl-10 bg-muted"
                    readOnly
                    disabled
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password (Optional)</FormLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    {...field}
                    className="pl-10"
                  />
                </FormControl>
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
