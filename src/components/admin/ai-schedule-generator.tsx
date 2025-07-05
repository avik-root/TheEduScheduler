
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, BrainCircuit, Upload, Network, BookCopy as ProgramIcon, Calendar, BookOpen, Users, Clock, ChevronsUpDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateSchedule, type GenerateScheduleOutput, type GenerateScheduleInput } from '@/ai/flows/generate-schedule';
import type { Room } from '@/lib/buildings';
import type { Department, Program, Year } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import type { Subject } from '@/lib/subjects';
import { publishSchedule } from '@/lib/schedule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ScheduleGeneratorSchema = z.object({
  departmentId: z.string().min(1, 'Please select a department.'),
  programId: z.string().min(1, 'Please select a program.'),
  yearId: z.string().min(1, 'Please select a year.'),
  classStartTime: z.string().min(1, 'Start time is required.'),
  classEndTime: z.string().min(1, 'End time is required.'),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
  subjectIds: z.array(z.string()).min(1, 'Please select at least one subject.'),
  facultyEmails: z.array(z.string()).min(1, 'Please select at least one faculty member.'),
});

type FormData = z.infer<typeof ScheduleGeneratorSchema>;

interface AiScheduleGeneratorProps {
    allRooms: Room[];
    generatedSchedule: GenerateScheduleOutput | null;
    setGeneratedSchedule: (schedule: GenerateScheduleOutput | null) => void;
    adminEmail: string;
    departments: Department[];
    faculty: Faculty[];
    subjects: Subject[];
}

export function AiScheduleGenerator({ allRooms, generatedSchedule, setGeneratedSchedule, adminEmail, departments, faculty, subjects }: AiScheduleGeneratorProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const { toast } = useToast();

  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [years, setYears] = React.useState<Year[]>([]);
  const [filteredSubjects, setFilteredSubjects] = React.useState<Subject[]>([]);
  const [filteredFaculty, setFilteredFaculty] = React.useState<Faculty[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(ScheduleGeneratorSchema),
    defaultValues: {
      departmentId: '',
      programId: '',
      yearId: '',
      classStartTime: '09:00',
      classEndTime: '17:00',
      breakStartTime: '13:00',
      breakEndTime: '14:00',
      subjectIds: [],
      facultyEmails: [],
    },
  });

  const departmentId = form.watch('departmentId');
  const programId = form.watch('programId');
  const yearId = form.watch('yearId');

  React.useEffect(() => {
    form.resetField('programId');
    form.resetField('yearId');
    form.resetField('subjectIds');
    form.resetField('facultyEmails');

    if (departmentId) {
        const selectedDept = departments.find(d => d.id === departmentId);
        setPrograms(selectedDept?.programs || []);
        setFilteredFaculty(faculty.filter(f => f.department === selectedDept?.name));
    } else {
        setPrograms([]);
        setFilteredFaculty([]);
    }
    setYears([]);
    setFilteredSubjects([]);
  }, [departmentId, departments, faculty, form]);

  React.useEffect(() => {
    form.resetField('yearId');
    form.resetField('subjectIds');
    if (programId) {
        const selectedProg = programs.find(p => p.id === programId);
        setYears(selectedProg?.years || []);
    } else {
        setYears([]);
    }
    setFilteredSubjects([]);
  }, [programId, programs, form]);
  
  React.useEffect(() => {
    form.resetField('subjectIds');
    if (yearId) {
        setFilteredSubjects(subjects.filter(s => s.yearId === yearId));
    } else {
        setFilteredSubjects([]);
    }
  }, [yearId, subjects, form]);


  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setGeneratedSchedule(null);

    const selectedDept = departments.find(d => d.id === data.departmentId);
    const selectedProg = selectedDept?.programs.find(p => p.id === data.programId);
    const selectedYear = selectedProg?.years.find(y => y.id === data.yearId);

    const subjectsToSchedule = subjects
        .filter(s => data.subjectIds.includes(s.id))
        .map(s => ({
            name: s.name,
            code: s.code,
            type: s.type,
            credits: (s.theoryCredits || 0) + (s.labCredits || 0),
        }));
    
    const facultyToSchedule = faculty
        .filter(f => data.facultyEmails.includes(f.email))
        .map(f => ({
            ...f,
            assignedSubjects: subjects.filter(s => s.facultyEmail === f.email).map(s => s.code),
        }));
        
    const input: GenerateScheduleInput = {
      yearInfo: `${selectedDept?.name} - ${selectedProg?.name} - ${selectedYear?.name}`,
      timeConstraints: `Classes from ${data.classStartTime} to ${data.classEndTime}. Break from ${data.breakStartTime} to ${data.breakEndTime}.`,
      availableRooms: allRooms.map(room => room.name),
      subjects: subjectsToSchedule,
      faculty: facultyToSchedule,
    };

    try {
      const result = await generateSchedule(input);
      setGeneratedSchedule(result);
      toast({
        title: 'Schedule Generated',
        description: 'The AI has successfully generated a new schedule.',
      });
    } catch (error) {
      console.error('Failed to generate schedule:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'An error occurred while generating the schedule.',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handlePublish() {
      if (!generatedSchedule?.schedule) return;
      setIsPublishing(true);
      const result = await publishSchedule(adminEmail, generatedSchedule.schedule);
      if (result.success) {
          toast({
              title: 'Schedule Published',
              description: 'The schedule is now available for faculty members.'
          });
      } else {
          toast({
              variant: 'destructive',
              title: 'Publish Failed',
              description: result.message
          });
      }
      setIsPublishing(false);
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Schedule Generator</CardTitle>
          <CardDescription>
            Select the academic year, define constraints, and let the AI create an optimal schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                {/* Academic Year Selection */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField control={form.control} name="departmentId" render={({ field }) => (
                        <FormItem><FormLabel>Department</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger></FormControl><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="programId" render={({ field }) => (
                        <FormItem><FormLabel>Program</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!departmentId}><FormControl><SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger></FormControl><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="yearId" render={({ field }) => (
                        <FormItem><FormLabel>Year</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!programId}><FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl><SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                </div>

                {/* Timings */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <FormLabel>Class Timings</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <FormField control={form.control} name="classStartTime" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="classEndTime" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                    </div>
                     <div>
                        <FormLabel>Break Time</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <FormField control={form.control} name="breakStartTime" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="breakEndTime" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        </div>
                    </div>
                </div>

                {/* Subjects & Faculty */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="subjectIds" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Subjects</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", field.value?.length === 0 && "text-muted-foreground")} disabled={!yearId}><span className="truncate">{field.value?.length > 0 ? `${field.value.length} selected` : "Select Subjects"}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search subjects..." /><CommandList><CommandEmpty>No subjects found for this year.</CommandEmpty><CommandGroup>{filteredSubjects.map(s => <CommandItem key={s.id} onSelect={() => { const selected = field.value || []; const newSelected = selected.includes(s.id) ? selected.filter(id => id !== s.id) : [...selected, s.id]; field.onChange(newSelected);}}><Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(s.id) ? "opacity-100" : "opacity-0")}/>{s.name} ({s.code})</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="facultyEmails" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Faculty</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", field.value?.length === 0 && "text-muted-foreground")} disabled={!departmentId}><span className="truncate">{field.value?.length > 0 ? `${field.value.length} selected` : "Select Faculty"}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search faculty..." /><CommandList><CommandEmpty>No faculty found for this department.</CommandEmpty><CommandGroup>{filteredFaculty.map(f => <CommandItem key={f.email} onSelect={() => { const selected = field.value || []; const newSelected = selected.includes(f.email) ? selected.filter(email => email !== f.email) : [...selected, f.email]; field.onChange(newSelected);}}><Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(f.email) ? "opacity-100" : "opacity-0")}/>{f.name} ({f.abbreviation})</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                </div>
              

              <div className="flex gap-2">
                <Button type="submit" className="w-fit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BrainCircuit className="mr-2 h-4 w-4" />
                  )}
                  Generate Schedule
                </Button>
                <Button type="button" variant="outline" onClick={handlePublish} disabled={!generatedSchedule || isLoading || isPublishing}>
                    {isPublishing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    Publish Schedule
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Schedule</CardTitle>
          <CardDescription>
            This is the optimal schedule generated by the AI based on your inputs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[100px] rounded-lg border bg-muted p-4 text-sm whitespace-pre-wrap">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : generatedSchedule ? (
              <p>{generatedSchedule.schedule}</p>
            ) : (
              <p className="text-muted-foreground">Your generated schedule will appear here...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
