
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, BookOpen, Hash, Type, Network, BookCopy as ProgramIcon, Calendar, User, ChevronsUpDown, Check, Star } from 'lucide-react';
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
import { UpdateSubjectSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateSubject, type Subject } from '@/lib/subjects';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Department, Program, Year } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

type FormData = z.infer<typeof UpdateSubjectSchema>;

interface EditSubjectFormProps {
  subject: Subject;
  onSuccess?: () => void;
  adminEmail: string;
  departments: Department[];
  faculty: Faculty[];
}

export function EditSubjectForm({ subject, onSuccess, adminEmail, departments, faculty }: EditSubjectFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(UpdateSubjectSchema),
    defaultValues: {
      ...subject,
      departmentId: subject.departmentId || '',
      programId: subject.programId || '',
      yearId: subject.yearId || '',
      facultyEmail: subject.facultyEmail || '',
      theoryCredits: subject.theoryCredits ?? 0,
      labCredits: subject.labCredits ?? 0,
    },
  });

  const departmentId = form.watch('departmentId');
  const programId = form.watch('programId');
  const type = form.watch('type');

  const [programs, setPrograms] = React.useState<Program[]>(() => {
    const dept = departments.find(d => d.id === form.getValues('departmentId'));
    return dept?.programs || [];
  });
  const [years, setYears] = React.useState<Year[]>(() => {
      const prog = programs.find(p => p.id === form.getValues('programId'));
      return prog?.years || [];
  });
   const [filteredFaculty, setFilteredFaculty] = React.useState<Faculty[]>(() => {
      const dept = departments.find(d => d.id === form.getValues('departmentId'));
      return dept ? faculty.filter(f => f.department === dept.name) : [];
  });


  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'departmentId') {
        form.setValue('programId', '');
        form.setValue('yearId', '');
        form.setValue('facultyEmail', '');
        const selectedDept = departments.find((d) => d.id === value.departmentId);
        const newPrograms = selectedDept?.programs || [];
        setPrograms(newPrograms);
        setFilteredFaculty(selectedDept ? faculty.filter(f => f.department === selectedDept.name) : []);
        setYears([]);
      }
      if (name === 'programId') {
        form.setValue('yearId', '');
        const selectedProg = programs.find((p) => p.id === value.programId);
        setYears(selectedProg?.years || []);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, departments, faculty, programs]);


  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await updateSubject(adminEmail, data);

    if (result.success) {
      toast({
        title: 'Subject Updated',
        description: `The subject "${data.name}" has been successfully updated.`,
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
              <FormLabel>Subject Name</FormLabel>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., Introduction to AI" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Code</FormLabel>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="e.g., CS-101" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                    </div>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Theory">Theory</SelectItem>
                  <SelectItem value="Lab">Lab</SelectItem>
                  <SelectItem value="Theory+Lab">Theory+Lab</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          {(type === 'Theory' || type === 'Theory+Lab' || type === 'Project') && (
            <FormField
              control={form.control}
              name="theoryCredits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theory Credits</FormLabel>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" placeholder="e.g., 3" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {(type === 'Lab' || type === 'Theory+Lab' || type === 'Project') && (
            <FormField
              control={form.control}
              name="labCredits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lab Credits</FormLabel>
                   <div className="relative">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1.5" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
         <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <div className="relative">
                    <Network className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                  </div>
                </FormControl>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="programId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!departmentId || programs.length === 0}>
                <FormControl>
                  <div className="relative">
                    <ProgramIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                  </div>
                </FormControl>
                <SelectContent>
                  {programs.map((prog) => (
                    <SelectItem key={prog.id} value={prog.id}>
                      {prog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="yearId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!programId || years.length === 0}>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select a year" />
                    </SelectTrigger>
                  </div>
                </FormControl>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
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
            <FormItem className="flex flex-col">
              <FormLabel>Faculty</FormLabel>
              <Popover>
                <PopoverTrigger asChild disabled={!departmentId || filteredFaculty.length === 0}>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? filteredFaculty.find(
                            (f) => f.email === field.value
                          )?.name
                        : "Assign a faculty member"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0">
                  <Command>
                    <CommandInput placeholder="Search faculty..." />
                    <CommandList>
                        <CommandEmpty>No faculty found.</CommandEmpty>
                        <CommandGroup>
                            {filteredFaculty.map((f) => (
                            <CommandItem
                                value={f.name}
                                key={f.email}
                                onSelect={() => {
                                  form.setValue("facultyEmail", f.email)
                                }}
                            >
                                <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    f.email === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                                />
                                {f.name}
                            </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
