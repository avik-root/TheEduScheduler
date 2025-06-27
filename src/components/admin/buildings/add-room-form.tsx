'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, DoorOpen, Users } from 'lucide-react';
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
import { AddRoomSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { addRoom } from '@/lib/buildings';

type FormData = z.infer<typeof AddRoomSchema>;

interface AddRoomFormProps {
  buildingId: string;
  onSuccess?: () => void;
}

export function AddRoomForm({ buildingId, onSuccess }: AddRoomFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(AddRoomSchema),
    defaultValues: {
      buildingId: buildingId,
      name: '',
      capacity: 30,
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await addRoom(data.buildingId, { name: data.name, capacity: data.capacity });

    if (result.success) {
      toast({
        title: 'Room Added',
        description: `The room "${data.name}" has been successfully added.`,
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
              <FormLabel>Room Name or Number</FormLabel>
              <div className="relative">
                <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., Room 101 or Lab A" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input type="number" placeholder="e.g., 30" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Room
        </Button>
      </form>
    </Form>
  );
}
