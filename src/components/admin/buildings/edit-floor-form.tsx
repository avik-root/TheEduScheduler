'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Layers } from 'lucide-react';
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
import { UpdateFloorSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateFloor, type Floor } from '@/lib/buildings';

type FormData = z.infer<typeof UpdateFloorSchema>;

interface EditFloorFormProps {
  buildingId: string;
  floor: Floor;
  onSuccess?: () => void;
}

export function EditFloorForm({ buildingId, floor, onSuccess }: EditFloorFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(UpdateFloorSchema),
    defaultValues: {
      buildingId: buildingId,
      floorId: floor.id,
      name: floor.name,
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await updateFloor(data.buildingId, data.floorId, { name: data.name });

    if (result.success) {
      toast({
        title: 'Floor Updated',
        description: `The floor "${data.name}" has been successfully updated.`,
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
              <FormLabel>Floor Name or Number</FormLabel>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., Ground Floor" {...field} className="pl-10" />
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
