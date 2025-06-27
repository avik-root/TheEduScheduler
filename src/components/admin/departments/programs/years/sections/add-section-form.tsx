
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Users, Hash, Users2 } from 'lucide-react';
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
import { BatchAddSectionSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { addSections } from '@/lib/departments';

type FormData = z.infer<typeof BatchAddSectionSchema>;

interface AddSectionFormProps {
  departmentId: string;
  programId: string;
  yearId: string;
  onSuccess?: () => void;
}

export function AddSectionForm({ departmentId, programId, yearId, onSuccess }: AddSectionFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(BatchAddSectionSchema),
    defaultValues: {
      departmentId,
      programId,
      yearId,
      prefix: 'Section ',
      start: 1,
      end: 4,
      studentCount: 60,
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const sectionsToCreate = [];
    for (let i = data.start; i <= data.end; i++) {
        sectionsToCreate.push({
            name: `${data.prefix}${i}`,
            studentCount: data.studentCount,
        });
    }

    const result = await addSections(data.departmentId, data.programId, data.yearId, sectionsToCreate);

    if (result.success) {
      toast({
        title: 'Sections Added',
        description: result.message,
      });
       form.reset({
        ...form.getValues(),
        prefix: 'Section ',
        start: 1,
        end: 4,
        studentCount: 60,
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
  const sectionCount = (end >= start) ? end - start + 1 : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section Name Prefix</FormLabel>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., Section or S" {...field} className="pl-10" />
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
          name="studentCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Count (for all sections)</FormLabel>
              <div className="relative">
                <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input type="number" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading || sectionCount <= 0}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add {sectionCount > 0 ? sectionCount : ''} Section{sectionCount !== 1 ? 's' : ''}
        </Button>
      </form>
    </Form>
  );
}
