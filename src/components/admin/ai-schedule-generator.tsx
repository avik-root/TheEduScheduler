'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, BrainCircuit, Upload, Sparkles, Building, BookCopy as ProgramIcon, Calendar, Users, Clock, ChevronsUpDown, Check, Badge, VenetianMask } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateSchedule, type GenerateScheduleOutput, type GenerateScheduleInput } from '@/ai/flows/generate-schedule';
import type { Room } from '@/lib/buildings';
import type { Department, Program, Year, Section } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import type { Subject } from '@/lib/subjects';
import { publishSchedule } from '@/lib/schedule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const subjectConfigSchema = z.object({
  id: z.string(),
  assignedFaculty: z.array(z.string()),
  isPriority: z.boolean(),
  sections: z.array(z.string()),
});

const ScheduleGeneratorSchema = z.object({
  departmentId: z.string().min(1, 'Department is required.'),
  programId: z.string().min(1, 'Program is required.'),
  yearId: z.string().min(1, 'Year is required.'),
  sectionIds: z.array(z.string()).min(1, 'At least one section must be selected.'),
  
  subjectConfigs: z.array(subjectConfigSchema),

  availableRooms: z.array(z.string()).min(1, 'Select at least one room or lab.'),
  
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  breakStart: z.string().min(1, 'Break start is required.'),
  breakEnd: z.string().min(1, 'Break end is required.'),

  activeDays: z.array(z.string()).min(1, 'Select at least one active day.'),
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

const allWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AiScheduleGenerator({ allRooms, generatedSchedule, setGeneratedSchedule, adminEmail, departments, faculty, subjects }: AiScheduleGeneratorProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const { toast } = useToast();

  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [years, setYears] = React.useState<Year[]>([]);
  const [sections, setSections] = React.useState<Section[]>([]);
  const [availableSubjects, setAvailableSubjects] = React.useState<Subject[]>([]);
  const [filteredFaculty, setFilteredFaculty] = React.useState<Faculty[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(ScheduleGeneratorSchema),
    defaultValues: {
      departmentId: '',
      programId: '',
      yearId: '',
      sectionIds: [],
      subjectConfigs: [],
      availableRooms: [],
      startTime: '09:00',
      endTime: '17:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
  });

  const { control, watch, setValue } = form;
  const departmentId = watch('departmentId');
  const programId = watch('programId');
  const yearId = watch('yearId');

  const { fields, replace } = useFieldArray({
    control,
    name: "subjectConfigs"
  });

  React.useEffect(() => {
    const selectedDept = departments.find(d => d.id === departmentId);
    setPrograms(selectedDept?.programs || []);
    setFilteredFaculty(faculty.filter(f => f.department === selectedDept?.name));
    setValue('programId', '');
    setValue('yearId', '');
    setYears([]);
    setSections([]);
    setAvailableSubjects([]);
  }, [departmentId, departments, faculty, setValue]);

  React.useEffect(() => {
    const selectedProg = programs.find(p => p.id === programId);
    setYears(selectedProg?.years || []);
    setValue('yearId', '');
    setSections([]);
    setAvailableSubjects([]);
  }, [programId, programs, setValue]);

  React.useEffect(() => {
    const selectedYear = years.find(y => y.id === yearId);
    const yearSubjects = subjects.filter(s => s.yearId === yearId);
    const yearSections = selectedYear?.sections || [];
    setSections(yearSections);
    setAvailableSubjects(yearSubjects);
    setValue('sectionIds', yearSections.map(s => s.id));
    
    replace(yearSubjects.map(s => ({
      id: s.id,
      subjectId: s.id,
      assignedFaculty: s.facultyEmails || [],
      isPriority: false,
      sections: yearSections.map(sec => sec.name)
    })));

  }, [yearId, years, subjects, setValue, replace]);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setGeneratedSchedule(null);

    const selectedDept = departments.find(d => d.id === data.departmentId)!;
    const selectedProg = programs.find(p => p.id === data.programId)!;
    const selectedYear = years.find(y => y.id === data.yearId)!;
    const selectedSections = sections.filter(s => data.sectionIds.includes(s.id));
    
    const configuredSubjects = data.subjectConfigs.map(config => {
      const subjectDetails = availableSubjects.find(s => s.id === config.subjectId)!;
      const assignedFacultyMembers = faculty.filter(f => config.assignedFaculty.includes(f.email));
      return {
        ...subjectDetails,
        assignedFaculty: assignedFacultyMembers.map(f => f.abbreviation),
        isPriority: config.isPriority,
        sections: selectedSections.map(s => s.name),
      };
    });

    const labs = allRooms.filter(r => r.name.toLowerCase().includes('lab')).map(r => r.name);
    const regularRooms = allRooms.filter(r => !r.name.toLowerCase().includes('lab')).map(r => r.name);

    const input: GenerateScheduleInput = {
      academicInfo: {
        department: selectedDept.name,
        program: selectedProg.name,
        year: selectedYear.name,
      },
      sections: selectedSections.map(s => ({ name: s.name, studentCount: s.studentCount })),
      subjects: configuredSubjects,
      faculty: filteredFaculty,
      availableRooms: regularRooms,
      availableLabs: labs,
      timeSettings: {
        startTime: data.startTime,
        endTime: data.endTime,
        breakTime: `${data.breakStart} - ${data.breakEnd}`,
      },
      activeDays: data.activeDays,
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
        description: 'An error occurred while generating the schedule. Check console for details.',
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <Card>
                <CardHeader>
                  <CardTitle>AI Schedule Generator</CardTitle>
                  <CardDescription>
                    Define constraints step-by-step and let the AI create an optimal schedule.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Step 1: Academic Target */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Step 1: Academic Target</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField control={form.control} name="departmentId" render={({ field }) => (
                            <FormItem><FormLabel>Department</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger></FormControl><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="programId" render={({ field }) => (
                            <FormItem><FormLabel>Program</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger></FormControl><SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="yearId" render={({ field }) => (
                            <FormItem><FormLabel>Year</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl><SelectContent>{years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )}/>
                    </div>
                     <FormField control={form.control} name="sectionIds" render={({ field }) => (
                        <FormItem><FormLabel>Sections to Schedule</FormLabel><div className="flex flex-wrap gap-2">{sections.map(item => (<FormField key={item.id} control={form.control} name="sectionIds" render={({ field }) => { return (<FormItem key={item.id} className="flex flex-row items-start space-x-2 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {return checked ? field.onChange([...field.value, item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))}} /></FormControl><FormLabel className="font-normal">{item.name}</FormLabel></FormItem>)}} />))}</div><FormMessage /></FormItem>
                     )} />
                  </div>
                  
                  <Separator />

                  {/* Step 2: Subject Configuration */}
                  <div className="space-y-4">
                     <h3 className="text-lg font-medium">Step 2: Subject Configuration</h3>
                     {fields.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                          {fields.map((item, index) => {
                             const subject = availableSubjects.find(s => s.id === item.subjectId)!;
                             return (
                                <AccordionItem value={item.id} key={item.id}>
                                  <AccordionTrigger>{subject.name} ({subject.code})</AccordionTrigger>
                                  <AccordionContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                       <Controller control={control} name={`subjectConfigs.${index}.assignedFaculty`} render={({ field }) => (
                                          <FormItem className="flex flex-col"><FormLabel>Assign Faculty</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between h-auto min-h-10", !field.value?.length && "text-muted-foreground")}><div className="flex flex-wrap gap-1">{field.value?.length > 0 ? field.value.map(email => (<Badge key={email} variant="secondary">{faculty.find(f => f.email === email)?.name || email}</Badge>)) : "Select Faculty"}</div><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search faculty..." /><CommandList><CommandEmpty>No faculty found for this department.</CommandEmpty><CommandGroup>{filteredFaculty.map(f => <CommandItem key={f.email} onSelect={() => { const selected = field.value || []; const newSelected = selected.includes(f.email) ? selected.filter(email => email !== f.email) : [...selected, f.email]; field.onChange(newSelected);}}><Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(f.email) ? "opacity-100" : "opacity-0")}/>{f.name} ({f.abbreviation})</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                                       )} />
                                       <FormField control={control} name={`subjectConfigs.${index}.isPriority`} render={({ field }) => (
                                         <FormItem className="flex flex-row items-center space-x-2 pt-8"><Checkbox checked={field.value} onCheckedChange={field.onChange} id={`priority-${index}`} /><label htmlFor={`priority-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mark as Priority Subject</label></FormItem>
                                       )} />
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                             )
                          })}
                        </Accordion>
                     ) : (
                        <p className="text-sm text-muted-foreground">Select a year to configure subjects.</p>
                     )}
                  </div>
                  
                  <Separator />

                  {/* Step 3: Resources & Time */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Step 3: Resources & Time Constraints</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                         <FormField control={form.control} name="availableRooms" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Available Rooms & Labs</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between h-auto min-h-10", !field.value?.length && "text-muted-foreground")}><div className="flex flex-wrap gap-1">{field.value?.length > 0 ? field.value.map(roomName => (<Badge key={roomName} variant="secondary">{roomName}</Badge>)) : "Select Rooms & Labs"}</div><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search rooms..." /><CommandList><CommandEmpty>No rooms found.</CommandEmpty><CommandGroup>{allRooms.map(r => <CommandItem key={r.id} onSelect={() => { const selected = field.value || []; const newSelected = selected.includes(r.name) ? selected.filter(name => name !== r.name) : [...selected, r.name]; field.onChange(newSelected);}}><Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(r.name) ? "opacity-100" : "opacity-0")}/>{r.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                         )} />
                        <div>
                            <FormLabel>Daily Timings</FormLabel>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="endTime" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                            <FormLabel className="mt-2 block">Break Slot</FormLabel>
                             <div className="grid grid-cols-2 gap-2 mt-2">
                                <FormField control={form.control} name="breakStart" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="breakEnd" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        </div>
                    </div>
                    <FormField control={form.control} name="activeDays" render={({ field }) => (
                        <FormItem><FormLabel>Active Weekdays</FormLabel><div className="flex flex-wrap gap-4">{allWeekdays.map((item) => (<FormField key={item} control={form.control} name="activeDays" render={({ field }) => { return (<FormItem key={item} className="flex flex-row items-start space-x-2 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {return checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((value) => value !== item))}} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}} />))}</div><FormMessage /></FormItem>
                    )} />
                  </div>

                </CardContent>
                <CardFooter className="gap-2">
                    <Button type="submit" className="w-fit" disabled={isLoading}>
                      {isLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Sparkles className="mr-2 h-4 w-4" /> )}
                      Generate Schedule
                    </Button>
                    <Button type="button" variant="outline" onClick={handlePublish} disabled={!generatedSchedule || isLoading || isPublishing}>
                        {isPublishing ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Upload className="mr-2 h-4 w-4" /> )}
                        Publish Schedule
                    </Button>
                </CardFooter>
            </Card>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>Generated Schedule</CardTitle>
          <CardDescription>
            This is the optimal schedule generated by the AI based on your inputs. You can publish it or refine your inputs and generate again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] rounded-lg border bg-muted p-4 text-sm whitespace-pre-wrap font-mono">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : generatedSchedule?.schedule ? (
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
