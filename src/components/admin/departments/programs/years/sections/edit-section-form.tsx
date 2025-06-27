
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Users, Users2 } from 'lucide-react';
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
import { UpdateSectionSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateSection, type Section } from '@/lib/departments';

type FormData = z.infer<typeof UpdateSectionSchema>;

interface EditSectionFormProps {
  departmentId: string;
  programId: string;
  yearId: string;
  section: Section;
  onSuccess?: () => void;
  adminEmail: string;
}

export function EditSectionForm({ departmentId, programId, yearId, section, onSuccess, adminEmail }: EditSectionFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(UpdateSectionSchema),
    defaultValues: {
      departmentId,
      programId,
      yearId,
      sectionId: section.id,
      name: section.name,
      studentCount: section.studentCount,
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await updateSection(adminEmail, data.departmentId, data.programId, data.yearId, data.sectionId, { name: data.name, studentCount: data.studentCount });

    if (result.success) {
      toast({
        title: 'Section Updated',
        description: `The section "${data.name}" has been successfully updated.`,
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
              <FormLabel>Section Name or Number</FormLabel>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., Section A" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="studentCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Count</FormLabel>
              <div className="relative">
                <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input type="number" placeholder="e.g., 60" {...field} className="pl-10" />
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
