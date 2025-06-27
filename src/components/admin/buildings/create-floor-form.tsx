'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Layers, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AddFloorSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { addFloors } from '@/lib/buildings';

type FormData = z.infer<typeof AddFloorSchema>;

interface CreateFloorFormProps {
  buildingId: string;
  onSuccess?: () => void;
}

export function CreateFloorForm({ buildingId, onSuccess }: CreateFloorFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [newFloorName, setNewFloorName] = React.useState('');
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(AddFloorSchema),
    defaultValues: {
      buildingId: buildingId,
      names: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'names',
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const names = data.names.map(item => item.name);
    const result = await addFloors(data.buildingId, names);

    if (result.success) {
      toast({
        title: 'Floors Added',
        description: result.message,
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

  const handleAddFloor = () => {
    const trimmedName = newFloorName.trim();
    if (trimmedName) {
      append({ name: trimmedName });
      setNewFloorName('');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <FormLabel>Floor Name(s)</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input
                placeholder="e.g., Ground Floor"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFloor();
                  }
                }}
              />
            </FormControl>
            <Button type="button" onClick={handleAddFloor} disabled={!newFloorName.trim()}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          <FormMessage>{form.formState.errors.names?.root?.message}</FormMessage>
        </div>
        
        {fields.length > 0 && (
          <div className="space-y-2 rounded-md border p-4">
            <FormLabel>Floors to be created</FormLabel>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center justify-between gap-2 rounded-md bg-muted p-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{field.name}</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || fields.length === 0}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create {fields.length > 0 ? `${fields.length} ` : ''}Floor(s)
        </Button>
      </form>
    </Form>
  );
}
