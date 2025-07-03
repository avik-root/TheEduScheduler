'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, BookOpen, Hash, Type, Network, BookCopy as ProgramIcon, Calendar, User, ChevronsUpDown, Check } from 'lucide-react';
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
import { SubjectSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { createSubject } from '@/lib/subjects';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Department, Program, Year } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


type FormData = z.infer<typeof SubjectSchema>;

interface CreateSubjectFormProps {
  onSuccess?: () => void;
  adminEmail: string;
  departments: Department[];
  faculty: Faculty[];
}

export function CreateSubjectForm({ onSuccess, adminEmail, departments, faculty }: CreateSubjectFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [years, setYears] = React.useState<Year[]>([]);
  const [filteredFaculty, setFilteredFaculty] = React.useState<Faculty[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(SubjectSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'Theory',
      departmentId: '',
      programId: '',
      yearId: '',
      facultyEmail: '',
    },
  });

  const departmentId = form.watch('departmentId');
  const programId = form.watch('programId');

  React.useEffect(() => {
    form.setValue('programId', '');
    form.setValue('yearId', '');
    form.setValue('facultyEmail', '');

    if (departmentId) {
      const selectedDept = departments.find((d) => d.id === departmentId);
      setPrograms(selectedDept?.programs || []);
      setFilteredFaculty(selectedDept ? faculty.filter(f => f.department === selectedDept.name) : []);
    } else {
      setPrograms([]);
      setFilteredFaculty([]);
    }
    setYears([]);
  }, [departmentId, departments, faculty, form]);

  React.useEffect(() => {
    form.setValue('yearId', '');
    if (programId) {
      const selectedProg = programs.find((p) => p.id === programId);
      setYears(selectedProg?.years || []);
    } else {
      setYears([]);
    }
  }, [programId, programs, form]);


  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await createSubject(adminEmail, data);

    if (result.success) {
      toast({
        title: 'Subject Created',
        description: `The subject "${data.name}" has been successfully created.`,
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
    <ScrollArea className="h-96">
      <div className="pr-6">
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
              Create Subject
            </Button>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
