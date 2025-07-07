'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Grid, Settings, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { publishSchedule } from '@/lib/schedule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddClassDialog } from './add-class-dialog';
import type { Department, Program, Year, Section } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import type { Subject } from '@/lib/subjects';
import type { Room } from '@/lib/buildings';

const ScheduleSettingsSchema = z.object({
  departmentId: z.string().min(1, 'Department is required.'),
  programId: z.string().min(1, 'Program is required.'),
  yearId: z.string().min(1, 'Year is required.'),
  sectionIds: z.array(z.string()).min(1, 'At least one section must be selected.'),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  breakStart: z.string().min(1, 'Break start is required.'),
  breakEnd: z.string().min(1, 'Break end is required.'),
  classDuration: z.coerce.number().min(10, 'Duration must be at least 10 minutes.'),
  activeDays: z.array(z.string()).min(1, 'Select at least one active day.'),
});

type SettingsFormData = z.infer<typeof ScheduleSettingsSchema>;

type ScheduleCell = string | null;
type ScheduleRow = ScheduleCell[];
type SectionScheduleData = {
  section: Section;
  rows: { day: string, slots: ScheduleRow }[];
};
type ScheduleData = SectionScheduleData[];

interface ManualScheduleCreatorProps {
    allRooms: Room[];
    adminEmail: string;
    departments: Department[];
    faculty: Faculty[];
    subjects: Subject[];
    publishedSchedule: string;
}

const allWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function generateTimeSlots(start: string, end: string, breakStart: string, breakEnd: string, duration: number): string[] {
    const slots: string[] = [];
    let currentTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const breakStartTime = new Date(`1970-01-01T${breakStart}:00`);
    const breakEndTime = new Date(`1970-01-01T${breakEnd}:00`);
    
    // Generate slots before the break
    while (currentTime < breakStartTime && currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60000);
        if (slotEnd > breakStartTime) break;
        slots.push(`${currentTime.toTimeString().substring(0, 5)}-${slotEnd.toTimeString().substring(0, 5)}`);
        currentTime = slotEnd;
    }

    // Add the break slot
    slots.push('Break');

    // Generate slots after the break
    currentTime = new Date(breakEndTime);
    while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60000);
        if (slotEnd > endTime) break;
        slots.push(`${currentTime.toTimeString().substring(0, 5)}-${slotEnd.toTimeString().substring(0, 5)}`);
        currentTime = slotEnd;
    }

    return slots;
}

export function ManualScheduleCreator({ allRooms, adminEmail, departments, faculty, subjects, publishedSchedule }: ManualScheduleCreatorProps) {
    const [isPublishing, setIsPublishing] = React.useState(false);
    const [view, setView] = React.useState<'settings' | 'grid'>('settings');
    const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
    const [scheduleData, setScheduleData] = React.useState<ScheduleData>([]);
    const [editingCell, setEditingCell] = React.useState<{ sectionIndex: number; rowIndex: number; slotIndex: number } | null>(null);
    const { toast } = useToast();
    const router = useRouter();
  
    const [availablePrograms, setAvailablePrograms] = React.useState<Program[]>([]);
    const [availableYears, setAvailableYears] = React.useState<Year[]>([]);
    const [availableSections, setAvailableSections] = React.useState<Section[]>([]);
    const [availableSubjects, setAvailableSubjects] = React.useState<Subject[]>([]);

    const form = useForm<SettingsFormData>({
        resolver: zodResolver(ScheduleSettingsSchema),
        defaultValues: {
            departmentId: '',
            programId: '',
            yearId: '',
            sectionIds: [],
            startTime: '09:00',
            endTime: '17:00',
            breakStart: '13:00',
            breakEnd: '14:00',
            classDuration: 50,
            activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
    });

    const { getValues, setValue, watch } = form;

    const handleDepartmentChange = (deptId: string) => {
        const selectedDept = departments.find(d => d.id === deptId);
        setAvailablePrograms(selectedDept?.programs || []);
        setValue('departmentId', deptId);
        setValue('programId', '');
        setValue('yearId', '');
        setValue('sectionIds', []);
    };

    const handleProgramChange = (progId: string) => {
        const selectedProg = availablePrograms.find(p => p.id === progId);
        setAvailableYears(selectedProg?.years || []);
        setValue('programId', progId);
        setValue('yearId', '');
        setValue('sectionIds', []);
    };

    const handleYearChange = (yearId: string) => {
        const selectedYear = availableYears.find(y => y.id === yearId);
        const yearSubjects = subjects.filter(s => s.yearId === yearId);
        setAvailableSections(selectedYear?.sections || []);
        setAvailableSubjects(yearSubjects);
        setValue('yearId', yearId);
        setValue('sectionIds', []);
    };

    function onGenerateTimetable(data: SettingsFormData) {
        const slots = generateTimeSlots(data.startTime, data.endTime, data.breakStart, data.breakEnd, data.classDuration);
        setTimeSlots(slots);

        const selectedSections = availableSections.filter(s => data.sectionIds.includes(s.id));

        const newScheduleData: ScheduleData = selectedSections.map(section => ({
            section,
            rows: data.activeDays.map(day => ({
                day,
                slots: Array(slots.length).fill(null)
            }))
        }));

        setScheduleData(newScheduleData);
        setView('grid');
    }

    function convertScheduleDataToMarkdown(): string {
        const selectedProg = availablePrograms.find(p => p.id === getValues('programId'))!;
        const selectedYear = availableYears.find(y => y.id === getValues('yearId'))!;
        
        let markdown = `## ${selectedProg.name} - ${selectedYear.name}\n\n`;

        scheduleData.forEach(sectionData => {
            markdown += `### ${sectionData.section.name}\n`;
            const header = `| Day | ${timeSlots.join(' | ')} |\n`;
            const separator = `|---|${timeSlots.map(() => '---').join('|')}|\n`;
            markdown += header + separator;

            sectionData.rows.forEach(row => {
                const rowCells = row.slots.map((cell, index) => {
                     if (timeSlots[index] === 'Break') {
                        return 'Break';
                    }
                    return cell || '-';
                }).join(' | ');
                markdown += `| ${row.day} | ${rowCells} |\n`;
            });
            markdown += '\n';
        });

        return markdown.trim();
    }

    const checkConflicts = (newClass: { faculty: string; room: string; sectionName: string }, sectionIndex: number, rowIndex: number, slotIndex: number): { isConflict: boolean, reason?: string } => {
        for (let i = 0; i < scheduleData.length; i++) {
            const otherSectionSchedule = scheduleData[i];
            const existingCell = otherSectionSchedule.rows[rowIndex].slots[slotIndex];

            if (existingCell) {
                // Section Conflict (if checking the same section)
                if (i === sectionIndex) {
                    return { isConflict: true, reason: `Section Conflict: This time slot is already occupied for ${newClass.sectionName}.` };
                }

                const roomMatch = existingCell.match(/in (.*)$/);
                const facultyMatch = existingCell.match(/\(([^)]+)\)/);
                
                const existingRoom = roomMatch ? roomMatch[1].trim() : null;
                const existingFaculty = facultyMatch ? facultyMatch[1].trim() : null;
                
                // Room Conflict Check
                if (existingRoom && existingRoom === newClass.room) {
                    return { isConflict: true, reason: `Room Conflict: Room ${newClass.room} is already booked for ${otherSectionSchedule.section.name} at this time.` };
                }

                // Faculty Conflict Check (skip for 'NF')
                if (newClass.faculty !== 'NF' && existingFaculty && existingFaculty === newClass.faculty) {
                    return { isConflict: true, reason: `Faculty Conflict: ${newClass.faculty} is already teaching in ${otherSectionSchedule.section.name} at this time.` };
                }
            }
        }

        return { isConflict: false };
    };


    function handleAddClass(data: { subjectId: string; facultyEmail: string; roomId: string; }) {
        if (!editingCell) return;
        const { sectionIndex, rowIndex, slotIndex } = editingCell;
        
        const section = scheduleData[sectionIndex].section;
        const subject = availableSubjects.find(s => s.id === data.subjectId)!;
        const room = allRooms.find(r => r.id === data.roomId)!;
        
        const isNoFaculty = data.facultyEmail === '--NF--';
        const facultyMember = isNoFaculty ? null : faculty.find(f => f.email === data.facultyEmail);
        const facultyAbbr = facultyMember ? facultyMember.abbreviation : 'NF';
        
        const newClassDetails = {
            faculty: facultyAbbr,
            room: room.name,
            sectionName: section.name
        };
        
        const conflictResult = checkConflicts(newClassDetails, sectionIndex, rowIndex, slotIndex);

        if (conflictResult.isConflict) {
            toast({
                variant: 'destructive',
                title: 'Scheduling Conflict',
                description: conflictResult.reason,
            });
        } else {
            const newScheduleData = [...scheduleData];
            const newCellContent = `${subject.name} (${facultyAbbr}) in ${room.name}`;
            newScheduleData[sectionIndex].rows[rowIndex].slots[slotIndex] = newCellContent;
            setScheduleData(newScheduleData);
            setEditingCell(null);
            toast({
                title: 'Class Added',
                description: `${subject.name} has been added to the schedule.`,
            });
        }
    }

    function handleClearCell(sectionIndex: number, rowIndex: number, slotIndex: number) {
        const newScheduleData = [...scheduleData];
        newScheduleData[sectionIndex].rows[rowIndex].slots[slotIndex] = null;
        setScheduleData(newScheduleData);
         toast({
            title: 'Cell Cleared',
            description: 'The class has been removed from this time slot.',
        });
    }

    async function handlePublish() {
      const markdown = convertScheduleDataToMarkdown();
      if (!markdown) return;
      setIsPublishing(true);
      const result = await publishSchedule(adminEmail, markdown);
      if (result.success) {
          toast({
              title: 'Schedule Published',
              description: 'The schedule is now available for faculty members.'
          });
          setView('settings');
          router.refresh();
      } else {
          toast({
              variant: 'destructive',
              title: 'Publish Failed',
              description: result.message
          });
      }
      setIsPublishing(false);
    }
    
    if (view === 'settings') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Manual Schedule Creator</CardTitle>
                    <CardDescription>Step 1: Define the parameters for your schedule grid.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onGenerateTimetable)} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                               <FormField control={form.control} name="departmentId" render={({ field }) => (
                                    <FormItem><FormLabel>Department</FormLabel><Select onValueChange={handleDepartmentChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger></FormControl><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                               <FormField control={form.control} name="programId" render={({ field }) => (
                                    <FormItem><FormLabel>Program</FormLabel><Select onValueChange={handleProgramChange} value={field.value} disabled={!watch('departmentId')}><FormControl><SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger></FormControl><SelectContent>{availablePrograms.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                               <FormField control={form.control} name="yearId" render={({ field }) => (
                                    <FormItem><FormLabel>Year</FormLabel><Select onValueChange={handleYearChange} value={field.value} disabled={!watch('programId')}><FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl><SelectContent>{availableYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <FormField
                                control={form.control}
                                name="sectionIds"
                                render={({ field }) => (
                                    <FormItem>
                                    <div className="mb-2">
                                        <FormLabel>Sections</FormLabel>
                                    </div>
                                    {availableSections.length > 0 && (
                                        <div className="flex items-center space-x-2 mb-4 p-2 rounded-md bg-muted/50 border">
                                            <Checkbox
                                                id="select-all-sections"
                                                checked={field.value?.length === availableSections.length}
                                                onCheckedChange={(checked) => {
                                                    return field.onChange(
                                                        checked ? availableSections.map((s) => s.id) : []
                                                    );
                                                }}
                                            />
                                            <label
                                                htmlFor="select-all-sections"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Select All
                                            </label>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {availableSections.map((item) => (
                                            <FormItem key={item.id} className="flex flex-row items-start space-x-2 space-y-0">
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...field.value, item.id])
                                                        : field.onChange(field.value?.filter(
                                                            (value) => value !== item.id
                                                        ));
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">{item.name}</FormLabel>
                                            </FormItem>
                                        ))}
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
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
                                        <FormControl><Input type="number" placeholder="e.g., 50" {...field} className="mt-2" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                             <FormField control={form.control} name="activeDays" render={({ field }) => (
                                <FormItem><FormLabel>Active Weekdays</FormLabel><div className="flex flex-wrap gap-4 pt-2">{allWeekdays.map((item) => (<FormField key={item} control={form.control} name="activeDays" render={({ field }) => { return (<FormItem key={item} className="flex flex-row items-start space-x-2 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {return checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((value) => value !== item))}} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>)}} />))}</div><FormMessage /></FormItem>
                            )} />
                            <Button type="submit"><Grid className="mr-2 h-4 w-4" /> Generate Timetable</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        );
    }
    
    const selectedProg = availablePrograms.find(p => p.id === getValues('programId'))!;
    const selectedYear = availableYears.find(y => y.id === getValues('yearId'))!;
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Manual Schedule Creator</CardTitle>
                        <CardDescription>
                            {selectedProg.name} - {selectedYear.name}. Click a cell to add a class.
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setView('settings')}><Settings className="mr-2 h-4 w-4" /> Edit Settings</Button>
                        <Button onClick={handlePublish} disabled={isPublishing}>
                            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Publish Schedule
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {scheduleData.map((sectionData, sectionIndex) => (
                        <div key={sectionData.section.id}>
                            <h3 className="text-lg font-semibold mb-2">{sectionData.section.name}</h3>
                            <div className="overflow-x-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Day</TableHead>
                                            {timeSlots.map((slot, i) => <TableHead key={i}>{slot}</TableHead>)}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sectionData.rows.map((row, rowIndex) => (
                                            <TableRow key={row.day}>
                                                <TableCell className="font-medium">{row.day}</TableCell>
                                                {row.slots.map((cell, slotIndex) => {
                                                    const isBreak = timeSlots[slotIndex] === 'Break';
                                                    return (
                                                        <TableCell 
                                                            key={slotIndex} 
                                                            className={`p-1 relative group ${isBreak ? 'bg-muted cursor-not-allowed' : 'cursor-pointer hover:bg-muted/80'}`}
                                                            onClick={() => !isBreak && !cell && setEditingCell({ sectionIndex, rowIndex, slotIndex })}
                                                        >
                                                            {cell ? (
                                                                <div className="bg-primary text-primary-foreground p-2 rounded-md text-xs font-semibold">
                                                                    {cell.split(' in ')[0]}
                                                                    <div className="font-normal opacity-90">{cell.split(' in ')[1]}</div>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                                                                        onClick={(e) => { e.stopPropagation(); handleClearCell(sectionIndex, rowIndex, slotIndex); }}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ) : isBreak ? (
                                                                <div className="h-12 flex items-center justify-center text-muted-foreground font-medium text-xs">Break</div>
                                                            ) : (
                                                                <div className="h-12 flex items-center justify-center text-muted-foreground/20 group-hover:text-muted-foreground/70 transition-colors">
                                                                    <Plus className="h-5 w-5" />
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))}
                </div>
                {editingCell && (
                    <AddClassDialog
                        isOpen={!!editingCell}
                        onClose={() => setEditingCell(null)}
                        onSave={handleAddClass}
                        subjects={availableSubjects}
                        faculty={faculty}
                        rooms={allRooms}
                    />
                )}
            </CardContent>
        </Card>
    );
}
