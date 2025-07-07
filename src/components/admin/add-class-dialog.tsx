'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import type { Subject } from '@/lib/subjects';
import type { Faculty } from '@/lib/faculty';
import type { Room } from '@/lib/buildings';
import { cn } from '@/lib/utils';

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

  const selectedSubjectId = form.watch('subjectId');

  const availableFaculty = React.useMemo(() => {
    if (!selectedSubjectId) {
      return [];
    }
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
    if (!selectedSubject || !selectedSubject.facultyEmails || selectedSubject.facultyEmails.length === 0) {
      return [];
    }
    return faculty.filter(f => selectedSubject.facultyEmails.includes(f.email));
  }, [selectedSubjectId, subjects, faculty]);

  const { availableRooms, availableLabs } = React.useMemo(() => {
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
    const theoryRooms = rooms.filter(r => !r.name.toLowerCase().includes('lab'));
    const labRooms = rooms.filter(r => r.name.toLowerCase().includes('lab'));

    if (selectedSubject?.type === 'Lab') {
        return { availableRooms: [], availableLabs: labRooms };
    }
    if (selectedSubject?.type === 'Theory') {
        return { availableRooms: theoryRooms, availableLabs: [] };
    }
    // For 'Theory+Lab', 'Project', or no subject selected, return all
    return { availableRooms: theoryRooms, availableLabs: labRooms };
  }, [selectedSubjectId, subjects, rooms]);


  React.useEffect(() => {
    // Reset facultyEmail when the available faculty changes and the current selection is no longer valid.
    if (selectedSubjectId && !availableFaculty.some(f => f.email === form.getValues('facultyEmail'))) {
      form.setValue('facultyEmail', '', { shouldValidate: true });
    }
  }, [selectedSubjectId, availableFaculty, form]);

   React.useEffect(() => {
    const currentRoomId = form.getValues('roomId');
    if (currentRoomId) {
        const allAvailableIds = [...availableRooms.map(r => r.id), ...availableLabs.map(r => r.id)];
        if (!allAvailableIds.includes(currentRoomId)) {
            form.setValue('roomId', '', { shouldValidate: true });
        }
    }
  }, [availableRooms, availableLabs, form]);


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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubjectId || availableFaculty.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!selectedSubjectId ? "Select a subject first" : "Select a faculty member"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableFaculty.length > 0 ? (
                         availableFaculty.map(f => <SelectItem key={f.email} value={f.email}>{f.name} ({f.abbreviation})</SelectItem>)
                      ) : (
                        <SelectItem value="disabled" disabled>
                          No faculty assigned to this subject
                        </SelectItem>
                      )}
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
                <FormItem className="flex flex-col">
                  <FormLabel>Room</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!selectedSubjectId}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? rooms.find(
                                (room) => room.id === field.value
                              )?.name
                            : "Select a room"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search room..." />
                        <CommandList>
                          <CommandEmpty>No room found for this subject type.</CommandEmpty>
                          {availableRooms.length > 0 && (
                            <CommandGroup heading="Classrooms">
                              {availableRooms.map((room) => (
                                <CommandItem
                                  value={room.name}
                                  key={room.id}
                                  onSelect={() => {
                                    form.setValue("roomId", room.id)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      room.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {room.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                           {availableLabs.length > 0 && (
                            <CommandGroup heading="Labs">
                              {availableLabs.map((room) => (
                                <CommandItem
                                  value={room.name}
                                  key={room.id}
                                  onSelect={() => {
                                    form.setValue("roomId", room.id)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      room.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {room.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
