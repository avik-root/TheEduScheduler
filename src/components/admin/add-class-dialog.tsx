'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Subject } from '@/lib/subjects';
import type { Faculty } from '@/lib/faculty';
import type { Room } from '@/lib/buildings';

const AddClassSchema = z.object({
  subjectId: z.string().min(1, "Please select a subject."),
  facultyEmail: z.string().min(1, "Please select a faculty member."),
  roomId: z.string().min(1, "Please select a room."),
});

type FormData = z.infer<typeof AddClassSchema>;

interface AddClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  subjects: Subject[];
  faculty: Faculty[];
  rooms: Room[];
}

export function AddClassDialog({ isOpen, onClose, onSave, subjects, faculty, rooms }: AddClassDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(AddClassSchema),
    defaultValues: {
      subjectId: '',
      facultyEmail: '',
      roomId: '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    await onSave(data);
    setIsLoading(false);
  };
  
  // Reset form when dialog is closed
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Class to Schedule</DialogTitle>
          <DialogDescription>Select the subject, faculty, and room for this time slot.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facultyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faculty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a faculty member" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {faculty.map(f => <SelectItem key={f.email} value={f.email}>{f.name} ({f.abbreviation})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Class
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
