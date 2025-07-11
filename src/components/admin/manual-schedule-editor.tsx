
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type GenerateScheduleOutput } from '@/ai/flows/generate-schedule';
import { publishSchedule } from '@/lib/schedule';
import { Loader2, Upload, X, Check, Clock, CalendarDays } from 'lucide-react';
import type { Department, Program, Year, Section } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import type { Subject } from '@/lib/subjects';
import { ScheduleCheckerDialog } from './schedule-checker-dialog';
import { parseMultipleSchedules, type ParsedSchedule, schedulesToMarkdown } from './schedule-viewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import type { Room } from '@/lib/buildings';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { format, addMinutes, parse as parseTime } from 'date-fns';


interface ManualScheduleEditorProps {
    generatedSchedule: GenerateScheduleOutput | null;
    setGeneratedSchedule: (schedule: GenerateScheduleOutput | null) => void;
    adminEmail: string;
    departments: Department[];
    faculty: Faculty[];
    subjects: Subject[];
    allRooms: Room[];
}

interface GridCell {
    subject: string;
    faculty: string;
    room: string;
}

type ScheduleGrid = Record<string, Record<string, GridCell>>;


export function ManualScheduleEditor({ generatedSchedule, setGeneratedSchedule, adminEmail, departments, faculty, subjects, allRooms }: ManualScheduleEditorProps) {
    const [isPublishing, setIsPublishing] = React.useState(false);
    const { toast } = useToast();

    const [selectedDept, setSelectedDept] = React.useState<string>('');
    const [selectedProg, setSelectedProg] = React.useState<string>('');
    const [selectedYear, setSelectedYear] = React.useState<string>('');
    
    const [availablePrograms, setAvailablePrograms] = React.useState<Program[]>([]);
    const [availableYears, setAvailableYears] = React.useState<Year[]>([]);
    const [yearSections, setYearSections] = React.useState<Section[]>([]);
    const [yearSubjects, setYearSubjects] = React.useState<Subject[]>([]);
    
    const [scheduleGrid, setScheduleGrid] = React.useState<ScheduleGrid>({});
    
    const [isGridGenerated, setIsGridGenerated] = React.useState(false);
    
    // Time settings state
    const [startTime, setStartTime] = React.useState('08:00');
    const [endTime, setEndTime] = React.useState('13:00');
    const [breakStart, setBreakStart] = React.useState('10:30');
    const [breakEnd, setBreakEnd] = React.useState('11:20');
    const [classDuration, setClassDuration] = React.useState(50);
    
    const [popoverOpenStates, setPopoverOpenStates] = React.useState<Record<string, boolean>>({});
    const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const handleGenerateGrid = () => {
        if (!selectedYear) {
            toast({ variant: "destructive", title: "Selection Missing", description: "Please select Department, Program, and Year first." });
            return;
        }
        
        const slots: string[] = [];
        let currentTime = parseTime(startTime, 'HH:mm', new Date());
        const finalTime = parseTime(endTime, 'HH:mm', new Date());
        const brkStart = parseTime(breakStart, 'HH:mm', new Date());
        const brkEnd = parseTime(breakEnd, 'HH:mm', new Date());
        let breakAdded = false;

        while (currentTime < finalTime) {
            // Check if it's time for the main break
            if (!breakAdded && currentTime >= brkStart && currentTime < brkEnd) {
                slots.push(`${format(brkStart, 'HH:mm')}-${format(brkEnd, 'HH:mm')}`);
                currentTime = brkEnd;
                breakAdded = true;
                continue;
            }

            const slotEnd = addMinutes(currentTime, classDuration);
            if (slotEnd > finalTime) break;
            
            slots.push(`${format(currentTime, 'HH:mm')}-${format(slotEnd, 'HH:mm')}`);
            
            currentTime = slotEnd;
        }

        setTimeSlots(slots);

        const year = availableYears.find(y => y.id === selectedYear);
        const newGrid: ScheduleGrid = {};
        (year?.sections || []).forEach(sec => {
            newGrid[sec.name] = {};
        });
        setScheduleGrid(newGrid);

        setIsGridGenerated(true);
    };


    const setPopoverOpen = (key: string, open: boolean) => {
        setPopoverOpenStates(prev => ({ ...prev, [key]: open }));
    }

    React.useEffect(() => {
        if (isGridGenerated) {
            const markdown = schedulesToMarkdown(parsedSchedulesForEditor);
            setGeneratedSchedule({ schedule: markdown });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduleGrid, isGridGenerated]);

    const handleDeptChange = (deptId: string) => {
        setSelectedDept(deptId);
        setSelectedProg('');
        setSelectedYear('');
        const dept = departments.find(d => d.id === deptId);
        setAvailablePrograms(dept?.programs || []);
        setIsGridGenerated(false);
    };
    
    const handleProgChange = (progId: string) => {
        setSelectedProg(progId);
        setSelectedYear('');
        const prog = availablePrograms.find(p => p.id === progId);
        setAvailableYears(prog?.years || []);
        setIsGridGenerated(false);
    };
    
    const handleYearChange = (yearId: string) => {
        setSelectedYear(yearId);
        const year = availableYears.find(y => y.id === yearId);
        setYearSections(year?.sections || []);
        setYearSubjects(subjects.filter(s => s.yearId === yearId));
        setIsGridGenerated(false);
    };

    const updateCell = (section: string, day: string, time: string, newCell: Partial<GridCell> | null) => {
        setScheduleGrid(prev => {
            const newGrid = { ...prev };
            const key = `${day}-${time}`;
            
            if (!newCell) { // Clearing the cell
                delete newGrid[section][key];
            } else {
                newGrid[section] = {
                    ...newGrid[section],
                    [key]: {
                        ...(newGrid[section]?.[key] || { subject: '', faculty: '', room: '' }),
                        ...newCell
                    }
                };
            }
            return newGrid;
        });
    };

    const parsedSchedulesForEditor = React.useMemo(() => {
        if (Object.keys(scheduleGrid).length === 0 || !selectedYear || !isGridGenerated) return [];
        
        const program = availablePrograms.find(p => p.id === selectedProg);
        const year = availableYears.find(y => y.id === selectedYear);
        const mainBreakSlot = `${breakStart}-${breakEnd}`;

        const schedules: ParsedSchedule[] = [{
            programYearTitle: `${program?.name || 'Program'} - ${year?.name || 'Year'}`,
            sections: Object.entries(scheduleGrid).map(([sectionName, gridData]) => {
                return {
                    sectionName: sectionName,
                    header: ['Day', ...timeSlots],
                    rows: days.map(day => {
                        return [
                            day,
                            ...timeSlots.map(time => {
                                if (time === mainBreakSlot) return 'Break';
                                const cell = gridData[`${day}-${time}`];
                                if (!cell || !cell.subject) return '-';
                                return `${cell.subject} (${cell.faculty || 'NF'}) in ${cell.room || 'N/A'}`;
                            })
                        ];
                    })
                };
            })
        }];
        return schedules;
    }, [scheduleGrid, selectedProg, selectedYear, availablePrograms, availableYears, days, timeSlots, breakStart, breakEnd, isGridGenerated]);


    async function handlePublish() {
        const markdown = schedulesToMarkdown(parsedSchedulesForEditor);
        if (!markdown.trim()) return;

        setIsPublishing(true);
        const result = await publishSchedule(adminEmail, markdown);
        if (result.success) {
            toast({ title: 'Schedule Published', description: 'The schedule is now available.' });
        } else {
            toast({ variant: 'destructive', title: 'Publish Failed', description: result.message });
        }
        setIsPublishing(false);
    }
    
    return (
        <CardContent className="pt-6">
            <div className="space-y-6">
                {!isGridGenerated ? (
                     <div className="space-y-6 p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <Select onValueChange={handleDeptChange} value={selectedDept}>
                                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select onValueChange={handleProgChange} value={selectedProg} disabled={!selectedDept}>
                                <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                                <SelectContent>{availablePrograms.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select onValueChange={handleYearChange} value={selectedYear} disabled={!selectedProg}>
                                <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                                <SelectContent>{availableYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="grid gap-2">
                                <Label>Daily Timings</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Break Slot</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="time" value={breakStart} onChange={e => setBreakStart(e.target.value)} />
                                    <Input type="time" value={breakEnd} onChange={e => setBreakEnd(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Class Duration (minutes)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="number" step="5" value={classDuration} onChange={e => setClassDuration(Number(e.target.value))} className="pl-10" placeholder="Class" />
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleGenerateGrid} disabled={!selectedYear}>
                           <CalendarDays className="mr-2 h-4 w-4" />
                           Set Timetable & Generate Grid
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                             <Button variant="outline" size="sm" onClick={() => setIsGridGenerated(false)}>
                                &larr; Back to Settings
                            </Button>
                        </div>
                        {yearSections.map(section => (
                            <Card key={section.id}>
                                <CardHeader>
                                    <CardTitle>{section.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                     <Table className="border">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Day</TableHead>
                                                {timeSlots.map(time => <TableHead key={time}>{time}</TableHead>)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {days.map(day => (
                                                <TableRow key={day}>
                                                    <TableCell className="font-medium">{day}</TableCell>
                                                    {timeSlots.map(time => {
                                                        const isBreak = time === `${format(parseTime(breakStart, 'HH:mm', new Date()), 'HH:mm')}-${format(parseTime(breakEnd, 'HH:mm', new Date()), 'HH:mm')}`;
                                                        const popoverKey = `${section.id}-${day}-${time}`;
                                                        const cellValue = scheduleGrid[section.name]?.[`${day}-${time}`];
                                                        
                                                        return (
                                                        <TableCell key={time} className={cn("p-1", isBreak && "bg-muted")}>
                                                            {!isBreak ? (
                                                                 <Popover open={popoverOpenStates[popoverKey]} onOpenChange={(open) => setPopoverOpen(popoverKey, open)}>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant="ghost" className="h-auto p-1 text-xs w-full justify-start text-left min-h-[52px]">
                                                                            {cellValue && cellValue.subject ? (
                                                                                <div>
                                                                                    <p className="font-semibold">{cellValue.subject}</p>
                                                                                    <p>{cellValue.faculty}</p>
                                                                                    <p className="text-muted-foreground">{cellValue.room}</p>
                                                                                </div>
                                                                            ) : <span className="text-muted-foreground">Empty</span>}
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-64 p-0" align="start">
                                                                        <div className="p-2 space-y-2">
                                                                            <h4 className="font-medium text-sm">{day}, {time}</h4>
                                                                            
                                                                            <Command><CommandInput placeholder="Search subject..." /><CommandList><CommandEmpty>No results</CommandEmpty><CommandGroup>{yearSubjects.map(s => <CommandItem key={s.id} onSelect={() => { updateCell(section.name, day, time, { subject: s.code }); setPopoverOpen(popoverKey, false); }}><Check className={cn("mr-2 h-4 w-4", cellValue?.subject === s.code ? "opacity-100" : "opacity-0")} />{s.name}</CommandItem>)}</CommandGroup></CommandList></Command>
                                                                            
                                                                            <Command><CommandInput placeholder="Search faculty..." /><CommandList><CommandEmpty>No results</CommandEmpty><CommandGroup>{faculty.map(f => <CommandItem key={f.email} onSelect={() => { updateCell(section.name, day, time, { faculty: f.abbreviation }); setPopoverOpen(popoverKey, false);}}><Check className={cn("mr-2 h-4 w-4", cellValue?.faculty === f.abbreviation ? "opacity-100" : "opacity-0")} />{f.name}</CommandItem>)}</CommandGroup></CommandList></Command>

                                                                            <Command><CommandInput placeholder="Search room..." /><CommandList><CommandEmpty>No results</CommandEmpty><CommandGroup>{allRooms.map(r => <CommandItem key={r.id} onSelect={() => { updateCell(section.name, day, time, { room: r.name }); setPopoverOpen(popoverKey, false);}}><Check className={cn("mr-2 h-4 w-4", cellValue?.room === r.name ? "opacity-100" : "opacity-0")} />{r.name}</CommandItem>)}</CommandGroup></CommandList></Command>
                                                                        </div>
                                                                        <Separator />
                                                                        <div className="p-2">
                                                                            <Button variant="destructive" size="sm" className="w-full" onClick={() => {updateCell(section.name, day, time, null); setPopoverOpen(popoverKey, false);}}>
                                                                                <X className="mr-2 h-4 w-4"/> Clear Cell
                                                                            </Button>
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                             ) : (
                                                                <div className="flex items-center justify-center h-full text-xs font-semibold text-muted-foreground">Break</div>
                                                             )}
                                                        </TableCell>
                                                    )})}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                
                {isGridGenerated && (
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={handlePublish} disabled={!selectedYear || isPublishing}>
                            {isPublishing ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Upload className="mr-2 h-4 w-4" /> )}
                            Save & Publish
                        </Button>
                        <ScheduleCheckerDialog 
                            schedules={parsedSchedulesForEditor} 
                            onApplyFixes={(newSchedule) => {
                                const parsed = parseMultipleSchedules(newSchedule);
                                if (parsed && parsed[0]) {
                                    const newGrid: ScheduleGrid = {};
                                    parsed[0].sections.forEach(sec => {
                                        newGrid[sec.sectionName] = {};
                                        sec.rows.forEach(row => {
                                            const day = row[0];
                                            row.slice(1).forEach((cell, index) => {
                                                const time = sec.header[index + 1];
                                                if (cell !== '-' && !cell.toLowerCase().includes('break')) {
                                                    const match = cell.match(/(.+) \((.+)\) in (.+)/);
                                                    if(match) {
                                                        newGrid[sec.sectionName][`${day}-${time}`] = {
                                                            subject: match[1].trim(),
                                                            faculty: match[2].trim(),
                                                            room: match[3].trim()
                                                        };
                                                    }
                                                }
                                            });
                                        });
                                    });
                                    setScheduleGrid(newGrid);
                                }
                                toast({ title: "Fixes Applied", description: "The AI's suggestions have been applied to the schedule. Remember to Save & Publish.",
                                });
                            }}
                        />
                    </div>
                 )}
            </div>
        </CardContent>
    );
}
