'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, Upload, ChevronsUpDown, Check, Star, AlertCircle, User, Users, Hash, Wand2, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '../ui/textarea';
import { ScheduleViewer } from './schedule-viewer';

const assignmentSchema = z.object({
  sectionId: z.string(),
  sectionName: z.string(),
  facultyEmail: z.string(), // Empty string for 'NF'
});

const subjectConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
  theoryCredits: z.coerce.number().optional(),
  labCredits: z.coerce.number().optional(),
  potentialFaculty: z.array(z.string()),
  isPriority: z.boolean(),
  assignments: z.array(assignmentSchema),
});


const ScheduleGeneratorSchema = z.object({
  departmentId: z.string().min(1, 'Department is required.'),
  programId: z.string().min(1, 'Program is required.'),
  yearId: z.string().min(1, 'Year is required.'),
  sectionIds: z.array(z.string()).min(1, 'At least one section must be selected.'),
  
  subjectConfigs: z.array(subjectConfigSchema),
  
  availableRooms: z.array(z.string()).min(1, 'Select at least one room.'),
  availableLabs: z.array(z.string()),
  
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  breakStart: z.string().min(1, 'Break start is required.'),
  breakEnd: z.string().min(1, 'Break end is required.'),
  classDuration: z.coerce.number().min(10, 'Duration must be at least 10 minutes.'),
  activeDays: z.array(z.string()).min(1, 'Select at least one active day.'),
  globalConstraints: z.string().optional(),
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
  const [showPreview, setShowPreview] = React.useState(false);
  const { toast } = useToast();
  
  const [availablePrograms, setAvailablePrograms] = React.useState<Program[]>([]);
  const [availableYears, setAvailableYears] = React.useState<Year[]>([]);
  const [availableSections, setAvailableSections] = React.useState<Section[]>([]);
  const [availableSubjects, setAvailableSubjects] = React.useState<Subject[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(ScheduleGeneratorSchema),
    defaultValues: {
      departmentId: '',
      programId: '',
      yearId: '',
      sectionIds: [],
      subjectConfigs: [],
      availableRooms: [],
      availableLabs: [],
      startTime: '09:00',
      endTime: '17:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      classDuration: 50,
      activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      globalConstraints: '',
    },
  });

  const { control, setValue, getValues, watch } = form;

  const { fields: subjectConfigFields, replace: replaceSubjectConfigs } = useFieldArray({
    control,
    name: "subjectConfigs"
  });

  const handleFacultyChange = (subjectIndex: number, newPotentialFaculty: string[]) => {
    const assignments = getValues(`subjectConfigs.${subjectIndex}.assignments`);
    const updatedAssignments = assignments.map(assignment => {
        if (assignment.facultyEmail && !newPotentialFaculty.includes(assignment.facultyEmail)) {
            return { ...assignment, facultyEmail: '' }; // Reset if assigned faculty is no longer potential
        }
        return assignment;
    });
    setValue(`subjectConfigs.${subjectIndex}.potentialFaculty`, newPotentialFaculty);
    setValue(`subjectConfigs.${subjectIndex}.assignments`, updatedAssignments);
  };
  
  const handleAutoAssign = (subjectIndex: number) => {
    const subjectConfig = getValues(`subjectConfigs.${subjectIndex}`);
    const potentialFacultyEmails = subjectConfig.potentialFaculty;
  
    if (!potentialFacultyEmails || potentialFacultyEmails.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Faculty Available',
        description: 'Please select faculty in "Available Faculty" before auto-assigning.',
      });
      return;
    }
  
    const assignments = subjectConfig.assignments;
    assignments.forEach((_assignment, assignmentIndex) => {
      const facultyEmailToAssign = potentialFacultyEmails[assignmentIndex % potentialFacultyEmails.length];
      setValue(`subjectConfigs.${subjectIndex}.assignments.${assignmentIndex}.facultyEmail`, facultyEmailToAssign, { shouldDirty: true });
    });
    
    form.trigger(`subjectConfigs.${subjectIndex}.assignments`);
    toast({
        title: "Faculty Auto-Assigned",
        description: `Successfully distributed faculty for ${subjectConfig.name}.`,
    });
  };

  const watchedSectionIds = watch("sectionIds", []);
  const watchedRooms = watch("availableRooms", []);
  const insufficientRooms = watchedRooms.length > 0 && watchedSectionIds.length > watchedRooms.length;
  
  const handleDepartmentChange = (deptId: string) => {
    const selectedDept = departments.find(d => d.id === deptId);
    const programs = selectedDept?.programs || [];
    setAvailablePrograms(programs);

    setValue('departmentId', deptId);
    setValue('programId', '');
    setValue('yearId', '');
    setValue('sectionIds', []);
    setAvailableYears([]);
    setAvailableSections([]);
    setAvailableSubjects([]);
    replaceSubjectConfigs([]);
  };

  const handleProgramChange = (progId: string) => {
    const selectedProg = availablePrograms.find(p => p.id === progId);
    const years = selectedProg?.years || [];
    setAvailableYears(years);

    setValue('programId', progId);
    setValue('yearId', '');
    setValue('sectionIds', []);
    setAvailableSections([]);
    setAvailableSubjects([]);
    replaceSubjectConfigs([]);
  };
  
  const handleYearChange = (yearId: string) => {
    const selectedYear = availableYears.find(y => y.id === yearId);
    const yearSubjects = subjects.filter(s => s.yearId === yearId);
    const yearSections = selectedYear?.sections || [];

    setAvailableSections(yearSections);
    setAvailableSubjects(yearSubjects);
    
    setValue('yearId', yearId);
    setValue('sectionIds', yearSections.map(s => s.id));
    
    replaceSubjectConfigs(yearSubjects.map(s => ({
      ...s,
      potentialFaculty: s.facultyEmails || [],
      isPriority: false,
      assignments: yearSections.map(sec => ({
        sectionId: sec.id,
        sectionName: sec.name,
        facultyEmail: '', // Default to unassigned
      }))
    })));
  };


  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setGeneratedSchedule(null);
    setShowPreview(false);
    
    const subjectsForAI = data.subjectConfigs.flatMap(config => {
        const assignmentsByFaculty = new Map<string, string[]>();

        config.assignments.forEach(assignment => {
            const facultyKey = (assignment.facultyEmail && assignment.facultyEmail !== '--NF--')
                ? assignment.facultyEmail 
                : 'NF';

            if (!assignmentsByFaculty.has(facultyKey)) {
                assignmentsByFaculty.set(facultyKey, []);
            }
            assignmentsByFaculty.get(facultyKey)!.push(assignment.sectionName);
        });

        if (assignmentsByFaculty.size === 0) {
            return []; // Skip subjects with no assigned sections.
        }

        const subjectDetails = availableSubjects.find(s => s.id === config.id)!;
        
        return Array.from(assignmentsByFaculty.entries()).map(([facultyKey, sections]) => {
            const assignedFacultyMember = faculty.find(f => f.email === facultyKey);
            return {
                ...subjectDetails,
                assignedFaculty: assignedFacultyMember ? [assignedFacultyMember.abbreviation] : [],
                isPriority: config.isPriority,
                sections: sections,
            };
        });
    });

    const hasAssignments = data.subjectConfigs.some(s => s.assignments.length > 0);
    if (!hasAssignments) {
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'Please select a year with sections and subjects to generate a schedule.',
        });
        setIsLoading(false);
        return;
    }
    
    const selectedDept = departments.find(d => d.id === data.departmentId)!;
    const selectedProg = availablePrograms.find(p => p.id === data.programId)!;
    const selectedYear = availableYears.find(y => y.id === data.yearId)!;
    const selectedSections = availableSections.filter(s => data.sectionIds.includes(s.id));

    const input: GenerateScheduleInput = {
      academicInfo: {
        department: selectedDept.name,
        program: selectedProg.name,
        year: selectedYear.name,
      },
      sections: selectedSections.map(s => ({ name: s.name, studentCount: s.studentCount })),
      subjects: subjectsForAI,
      faculty: faculty,
      availableRooms: data.availableRooms,
      availableLabs: data.availableLabs,
      timeSettings: {
        startTime: data.startTime,
        endTime: data.endTime,
        breakTime: `${data.breakStart} - ${data.breakEnd}`,
        classDuration: data.classDuration,
      },
      activeDays: data.activeDays,
      globalConstraints: data.globalConstraints,
    };
    
    try {
      const result = await generateSchedule(input);
      setGeneratedSchedule(result);
      setShowPreview(true);
      toast({
        title: 'Schedule Generated',
        description: 'The AI has created a schedule draft. Click "Show Preview" to review.',
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
  
  const theoryRooms = React.useMemo(() => allRooms.filter(r => !r.name.toLowerCase().includes('lab')), [allRooms]);
  const labRooms = React.useMemo(() => allRooms.filter(r => r.name.toLowerCase().includes('lab')), [allRooms]);

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
                <CardHeader>
                  <CardTitle>AI Schedule Generator</CardTitle>
                   <CardDescription>
                    A step-by-step guide to generating an optimal, conflict-free schedule.
                  </CardDescription>
                </CardHeader>
                <Accordion type="multiple" defaultValue={['step-1']} className="w-full">
                  <AccordionItem value="step-1">
                    <AccordionTrigger className="text-lg font-semibold px-6">Step 1: Academic Target</AccordionTrigger>
                    <AccordionContent className="px-6 pt-4 space-y-4">
                        <p className="text-sm text-muted-foreground">Select the department, program, and year to generate a schedule for.</p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField control={form.control} name="departmentId" render={({ field }) => (
                                <FormItem><FormLabel>Department</FormLabel><Select onValueChange={handleDepartmentChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger></FormControl><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="programId" render={({ field }) => (
                                <FormItem><FormLabel>Program</FormLabel><Select onValueChange={handleProgramChange} value={field.value} disabled={!getValues('departmentId')}><FormControl><SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger></FormControl><SelectContent>{availablePrograms.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="yearId" render={({ field }) => (
                                <FormItem><FormLabel>Year</FormLabel><Select onValueChange={handleYearChange} value={field.value} disabled={!getValues('programId')}><FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl><SelectContent>{availableYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="step-2">
                    <AccordionTrigger className="text-lg font-semibold px-6">Step 2: Subject & Faculty Configuration</AccordionTrigger>
                    <AccordionContent className="px-6 pt-4 space-y-4">
                        <p className="text-sm text-muted-foreground">For each subject, define potential faculty and then assign them to specific sections.</p>
                         {subjectConfigFields.length > 0 ? (
                            <div className="space-y-4 pt-2">
                                {subjectConfigFields.map((item, index) => {
                                    const availableFacultyForSubject = faculty.filter(f => (item.potentialFaculty || []).includes(f.email));
                                    return (
                                        <Card key={item.id} className="p-4 bg-muted/50">
                                            <div className="flex justify-between items-start">
                                                <div className="grid gap-1">
                                                    <h4 className="font-semibold">{item.name} ({item.code})</h4>
                                                    <p className="text-xs text-muted-foreground">{item.type} &bull; T:{item.theoryCredits || 0}, L:{item.labCredits || 0}</p>
                                                </div>
                                                <FormField control={control} name={`subjectConfigs.${index}.isPriority`} render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-2"><Checkbox checked={field.value} onCheckedChange={field.onChange} id={`priority-${index}`} /><label htmlFor={`priority-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Priority</label></FormItem>
                                                 )} />
                                            </div>
                                            <Separator className="my-4" />
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <Controller control={control} name={`subjectConfigs.${index}.potentialFaculty`} render={({ field }) => (
                                                    <FormItem className="flex flex-col"><FormLabel>Available Faculty for this Subject</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between h-auto min-h-10", !field.value?.length && "text-muted-foreground")}><div className="flex flex-wrap gap-1">{field.value?.length > 0 ? field.value.map(email => (<Badge key={email} variant="secondary">{faculty.find(f => f.email === email)?.name || 'NF'}</Badge>)) : "Select Faculty..."}</div><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search faculty..." /><CommandList><CommandEmpty>No faculty found.</CommandEmpty><CommandGroup>{faculty.filter(f => f.department === departments.find(d => d.id === getValues('departmentId'))?.name).map(f => <CommandItem key={f.email} onSelect={() => { const selected = field.value || []; const newSelected = selected.includes(f.email) ? selected.filter(email => email !== f.email) : [...selected, f.email]; handleFacultyChange(index, newSelected);}}><Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(f.email) ? "opacity-100" : "opacity-0")}/>{f.name} ({f.abbreviation})</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                                                )} />
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                      <FormLabel>Section Assignments</FormLabel>
                                                      <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => handleAutoAssign(index)}>
                                                          <Wand2 className="mr-2 h-4 w-4" />
                                                          Auto-assign Faculty
                                                      </Button>
                                                    </div>
                                                    <div className="rounded-md border">
                                                        <Table>
                                                            <TableHeader><TableRow><TableHead><Users className="h-4 w-4" /> Section</TableHead><TableHead><User className="h-4 w-4" /> Assigned Faculty</TableHead></TableRow></TableHeader>
                                                            <TableBody>
                                                                {item.assignments.map((assignment, assignmentIndex) => (
                                                                    <TableRow key={assignment.sectionId}>
                                                                        <TableCell className="font-medium">{assignment.sectionName}</TableCell>
                                                                        <TableCell>
                                                                            <FormField control={control} name={`subjectConfigs.${index}.assignments.${assignmentIndex}.facultyEmail`} render={({ field }) => (
                                                                                <FormItem><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Not Assigned" /></SelectTrigger></FormControl><SelectContent><SelectItem value="--NF--">NF (No Faculty)</SelectItem>{availableFacultyForSubject.map(fac => <SelectItem key={fac.email} value={fac.email}>{fac.name} ({fac.abbreviation})</SelectItem>)}</SelectContent></Select></FormItem>
                                                                            )}/>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground pt-2">Select a year to configure subjects.</p>
                        )}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="step-3">
                    <AccordionTrigger className="text-lg font-semibold px-6">Step 3: Resources & Time Constraints</AccordionTrigger>
                    <AccordionContent className="px-6 pt-4 space-y-6">
                       <div>
                            <div className="flex items-center justify-between mb-2">
                                <FormLabel>Available Rooms & Labs</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => {
                                        setValue('availableRooms', theoryRooms.map(r => r.name), { shouldValidate: true });
                                        setValue('availableLabs', labRooms.map(r => r.name), { shouldValidate: true });
                                    }}>
                                        Auto-select Required
                                    </Button>
                                    <Separator orientation="vertical" className="h-4" />
                                     <Button type="button" variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={() => {
                                         setValue('availableRooms', [], { shouldValidate: true });
                                         setValue('availableLabs', [], { shouldValidate: true });
                                     }}>
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                            <FormDescription className="pb-2 text-sm text-muted-foreground">Select all rooms and labs available for this schedule, or use the auto-select option.</FormDescription>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-2">
                               <FormField control={form.control} name="availableRooms" render={({ field }) => (
                                  <FormItem className="flex flex-col"><FormLabel className="text-sm">Classrooms</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between h-auto min-h-10", field.value?.length === 0 && "text-muted-foreground")}><div className="flex flex-wrap gap-1">{field.value?.length > 0 ? field.value.map(roomName => (<Badge key={roomName} variant="secondary">{roomName}</Badge>)) : "Select Rooms"}</div><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search rooms..." /><CommandList><CommandEmpty>No rooms found.</CommandEmpty><CommandGroup>{theoryRooms.map(room => <CommandItem key={room.id} onSelect={() => { const selected = field.value || []; const newSelected = selected.includes(room.name) ? selected.filter(r => r !== room.name) : [...selected, room.name]; field.onChange(newSelected);}}><Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(room.name) ? "opacity-100" : "opacity-0")}/>{room.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                               )} />
                               <FormField control={form.control} name="availableLabs" render={({ field }) => (
                                  <FormItem className="flex flex-col"><FormLabel className="text-sm">Labs</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between h-auto min-h-10", field.value?.length === 0 && "text-muted-foreground")}><div className="flex flex-wrap gap-1">{field.value?.length > 0 ? field.value.map(labName => (<Badge key={labName} variant="secondary">{labName}</Badge>)) : "Select Labs"}</div><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Search labs..." /><CommandList><CommandEmpty>No labs found.</CommandEmpty><CommandGroup>{labRooms.map(lab => <CommandItem key={lab.id} onSelect={() => { const selected = field.value || []; const newSelected = selected.includes(lab.name) ? selected.filter(r => r !== lab.name) : [...selected, lab.name]; field.onChange(newSelected);}}><Check className={cn("mr-2 h-4 w-4", (field.value || []).includes(lab.name) ? "opacity-100" : "opacity-0")}/>{lab.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>
                               )} />
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                           <div className="md:col-span-1">
                               <FormLabel>Daily Timings</FormLabel>
                               <div className="grid grid-cols-2 gap-2 mt-2">
                                   <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                   <FormField control={form.control} name="endTime" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                               </div>
                           </div>
                           <div className="md:col-span-1">
                               <FormLabel>Break Slot</FormLabel>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                   <FormField control={form.control} name="breakStart" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                   <FormField control={form.control} name="breakEnd" render={({ field }) => (<FormItem><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                               </div>
                           </div>
                            <FormField control={form.control} name="classDuration" render={({ field }) => (
                                <FormItem className="md:col-span-1">
                                    <FormLabel>Class Duration (mins)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 50" {...field} className="mt-2" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                         <FormField control={form.control} name="activeDays" render={({ field }) => (
                            <FormItem><FormLabel>Active Weekdays</FormLabel><div className="flex flex-wrap gap-4 pt-2">{allWeekdays.map((item) => (<FormField key={item} control={form.control} name="activeDays" render={({ field }) => { return (<FormItem key={item} className="flex flex-row items-start space-x-2 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {return checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((value) => value !== item))}} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}} />))}</div><FormMessage /></FormItem>
                        )} />
                        <Separator />
                        <FormField control={form.control} name="globalConstraints" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Global Constraints</FormLabel>
                                <FormDescription>
                                    Add any specific rules or preferences for the AI to follow (e.g., "No classes for Year 1 before 10 AM").
                                </FormDescription>
                                <FormControl>
                                    <Textarea placeholder="Enter any additional scheduling rules here..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="px-6 pb-6 flex flex-col gap-4">
                    {insufficientRooms && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Insufficient Rooms Warning</AlertTitle>
                        <AlertDescription>
                          You have selected {watchedSectionIds.length} sections but only {watchedRooms.length} classrooms. The AI will attempt to generate a schedule, but more rooms may be required to avoid conflicts.
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="flex items-center gap-2">
                        <Button type="submit" className="w-fit" disabled={isLoading}>
                          {isLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Sparkles className="mr-2 h-4 w-4" /> )}
                          {generatedSchedule ? 'Re-generate Schedule' : 'Generate Schedule'}
                        </Button>
                        {generatedSchedule && (
                            <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={handlePublish} disabled={!generatedSchedule || isLoading || isPublishing}>
                            {isPublishing ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Upload className="mr-2 h-4 w-4" /> )}
                            Publish Schedule
                        </Button>
                    </div>
                </div>
            </Card>
        </form>
      </Form>
      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border bg-muted mt-6 h-60">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-muted-foreground">Generating schedule, this might take a moment...</p>
        </div>
      )}
      {showPreview && generatedSchedule && !isLoading && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-2">Generated Schedule Preview</h2>
          <p className="text-muted-foreground mb-4">
            Review the schedule below. If it looks correct, click "Publish Schedule" above to make it live for all faculty.
          </p>
          <ScheduleViewer schedule={generatedSchedule.schedule} adminEmail={adminEmail} showControls={false} />
        </div>
      )}
    </div>
  );
}
