'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Building } from 'lucide-react';
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
import { BuildingSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { createBuilding } from '@/lib/buildings';

type FormData = z.infer<typeof BuildingSchema>;

interface CreateBuildingFormProps {
  onSuccess?: () => void;
}

export function CreateBuildingForm({ onSuccess }: CreateBuildingFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(BuildingSchema),
    defaultValues: {
      name: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await createBuilding(data);

    if (result.success) {
      toast({
        title: 'Building Created',
        description: `The building "${data.name}" has been successfully created.`,
      });
      form.reset();
      router.refresh();
      onSuccess?.();
    } else {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
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
              <FormLabel>Building Name</FormLabel>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., Science Hall" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Building
        </Button>
      </form>
    </Form>
  );
}
