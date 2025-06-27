'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, DoorOpen, Users, Hash } from 'lucide-react';
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
import { BatchAddRoomSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { addRooms } from '@/lib/buildings';

type FormData = z.infer<typeof BatchAddRoomSchema>;

interface AddRoomFormProps {
  buildingId: string;
  floorId: string;
  onSuccess?: () => void;
  adminEmail: string;
}

export function AddRoomForm({ buildingId, floorId, onSuccess, adminEmail }: AddRoomFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(BatchAddRoomSchema),
    defaultValues: {
      buildingId: buildingId,
      floorId: floorId,
      prefix: 'Room ',
      start: 1,
      end: 10,
      capacity: 60,
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const roomsToCreate = [];
    for (let i = data.start; i <= data.end; i++) {
        roomsToCreate.push({
            name: `${data.prefix}${i}`,
            capacity: data.capacity,
        });
    }

    const result = await addRooms(adminEmail, data.buildingId, data.floorId, roomsToCreate);

    if (result.success) {
      toast({
        title: 'Rooms Added',
        description: result.message,
      });
       form.reset({
        ...form.getValues(),
        prefix: 'Room ',
        start: 1,
        end: 10,
        capacity: 60,
      });
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

  const [start, end] = form.watch(['start', 'end']);
  const roomCount = (end >= start) ? end - start + 1 : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Name Prefix</FormLabel>
              <div className="relative">
                <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., Room or Lab" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Number</FormLabel>
                   <div className="relative">
                     <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Number</FormLabel>
                   <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity (for all rooms)</FormLabel>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input type="number" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading || roomCount <= 0}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add {roomCount > 0 ? roomCount : ''} Room{roomCount !== 1 ? 's' : ''}
        </Button>
      </form>
    </Form>
  );
}
