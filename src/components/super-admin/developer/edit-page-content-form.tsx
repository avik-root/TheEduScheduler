
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { DeveloperPageContentSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateDeveloperPageContent, type DeveloperPageContent } from '@/lib/developer';

type FormData = z.infer<typeof DeveloperPageContentSchema>;

interface EditPageContentFormProps {
  content: DeveloperPageContent;
  onSuccess?: () => void;
}

export function EditPageContentForm({ content, onSuccess }: EditPageContentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(DeveloperPageContentSchema),
    defaultValues: content,
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await updateDeveloperPageContent(data);

    if (result.success) {
      toast({
        title: 'Content Updated',
        description: 'The developer page content has been successfully updated.',
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
          name="aboutTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Section Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="aboutDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Section Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teamTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Section Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teamDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Section Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
              </FormControl>
               <p className="text-xs text-muted-foreground">This is the text that appears before the styled "MintFire." text.</p>
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
