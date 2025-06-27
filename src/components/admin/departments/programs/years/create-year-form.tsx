
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Calendar, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AddYearsSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { addYears } from '@/lib/departments';

type FormData = z.infer<typeof AddYearsSchema>;

interface CreateYearFormProps {
  departmentId: string;
  programId: string;
  onSuccess?: () => void;
  adminEmail: string;
}

export function CreateYearForm({ departmentId, programId, onSuccess, adminEmail }: CreateYearFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [newYearName, setNewYearName] = React.useState('');
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(AddYearsSchema),
    defaultValues: {
      departmentId: departmentId,
      programId: programId,
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
    const result = await addYears(adminEmail, data.departmentId, data.programId, names);

    if (result.success) {
      toast({
        title: 'Years Added',
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

  const handleAddYear = () => {
    const trimmedName = newYearName.trim();
    if (trimmedName) {
      append({ name: trimmedName });
      setNewYearName('');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <FormLabel>Year Name(s)</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input
                placeholder="e.g., First Year or Year 1"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddYear();
                  }
                }}
              />
            </FormControl>
            <Button type="button" onClick={handleAddYear} disabled={!newYearName.trim()}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          <FormMessage>{form.formState.errors.names?.root?.message}</FormMessage>
        </div>
        
        {fields.length > 0 && (
          <div className="space-y-2 rounded-md border p-4">
            <FormLabel>Years to be created</FormLabel>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center justify-between gap-2 rounded-md bg-muted p-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
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
          Create {fields.length > 0 ? `${fields.length} ` : ''}Year(s)
        </Button>
      </form>
    </Form>
  );
}
