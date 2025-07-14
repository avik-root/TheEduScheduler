'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Tag, CheckCircle, AlertTriangle } from 'lucide-react';
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
import { VersionSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateVersion, type Version } from '@/lib/version';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


type FormData = z.infer<typeof VersionSchema>;

interface EditVersionFormProps {
  currentVersion: Version;
  onSuccess?: () => void;
}

export function EditVersionForm({ currentVersion, onSuccess }: EditVersionFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(VersionSchema),
    defaultValues: currentVersion,
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await updateVersion(data);

    if (result.success) {
      toast({
        title: 'Version Updated',
        description: `The application version is now ${data.version}.`,
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
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Version Number</FormLabel>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., 1.0.0.1" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Beta" />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" /> Beta
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Stable" />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Stable
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
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
