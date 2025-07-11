'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type GenerateScheduleOutput } from '@/ai/flows/generate-schedule';
import { publishSchedule } from '@/lib/schedule';
import { Loader2, Upload, Wand, X, ChevronsUpDown, Check } from 'lucide-react';
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
import { Badge } from '../ui/badge';
import { getAllRooms, type Room } from '@/lib/buildings';


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

    const timeSlots = ['11:00-11:50', '12:00-12:50', '13:00-13:50', '14:00-14:50', '15:30-16:20', '16:30-17:20', '17:30-18:20'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    React.useEffect(() => {
        const markdown = schedulesToMarkdown(parsedSchedulesForEditor);
        setGeneratedSchedule({ schedule: markdown });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduleGrid]);

    const handleDeptChange = (deptId: string) => {
        setSelectedDept(deptId);
        setSelectedProg('');
        setSelectedYear('');
        const dept = departments.find(d => d.id === deptId);
        setAvailablePrograms(dept?.programs || []);
    };
    
    const handleProgChange = (progId: string) => {
        setSelectedProg(progId);
        setSelectedYear('');
        const prog = availablePrograms.find(p => p.id === progId);
        setAvailableYears(prog?.years || []);
    };
    
    const handleYearChange = (yearId: string) => {
        setSelectedYear(yearId);
        const year = availableYears.find(y => y.id === yearId);
        setYearSections(year?.sections || []);
        setYearSubjects(subjects.filter(s => s.yearId === yearId));
        
        // Initialize grid for all sections of this year
        const newGrid: ScheduleGrid = {};
        (year?.sections || []).forEach(sec => {
            newGrid[sec.name] = {};
        });
        setScheduleGrid(newGrid);
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
        if (Object.keys(scheduleGrid).length === 0 || !selectedYear) return [];
        
        const program = availablePrograms.find(p => p.id === selectedProg);
        const year = availableYears.find(y => y.id === selectedYear);

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
    }, [scheduleGrid, selectedProg, selectedYear, availablePrograms, availableYears, days, timeSlots]);


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
            <div className="space-y-4">
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
                
                {selectedYear && (
                    <div className="space-y-6">
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
                                                    {timeSlots.map(time => (
                                                        <TableCell key={time}>
                                                             <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="ghost" className="h-auto p-1 text-xs w-full justify-start text-left min-h-10">
                                                                         {scheduleGrid[section.name]?.[`${day}-${time}`] ? (
                                                                            <div>
                                                                                <p className="font-semibold">{scheduleGrid[section.name][`${day}-${time}`].subject}</p>
                                                                                <p>{scheduleGrid[section.name][`${day}-${time}`].faculty}</p>
                                                                                <p className="text-muted-foreground">{scheduleGrid[section.name][`${day}-${time}`].room}</p>
                                                                            </div>
                                                                         ) : <span className="text-muted-foreground">Empty</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-64 p-2 space-y-2">
                                                                     <h4 className="font-medium text-sm">{day}, {time}</h4>
                                                                     <Select onValueChange={(val) => updateCell(section.name, day, time, { subject: val })} defaultValue={scheduleGrid[section.name]?.[`${day}-${time}`]?.subject}>
                                                                         <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                                                                         <SelectContent>{yearSubjects.map(s => <SelectItem key={s.id} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                                                                     </Select>
                                                                     <Select onValueChange={(val) => updateCell(section.name, day, time, { faculty: val })} defaultValue={scheduleGrid[section.name]?.[`${day}-${time}`]?.faculty}>
                                                                         <SelectTrigger><SelectValue placeholder="Select Faculty" /></SelectTrigger>
                                                                         <SelectContent>{faculty.map(f => <SelectItem key={f.email} value={f.abbreviation}>{f.name} ({f.abbreviation})</SelectItem>)}</SelectContent>
                                                                     </Select>
                                                                     <Select onValueChange={(val) => updateCell(section.name, day, time, { room: val })} defaultValue={scheduleGrid[section.name]?.[`${day}-${time}`]?.room}>
                                                                         <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                                                                         <SelectContent>{allRooms.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                                                                     </Select>
                                                                     <Button variant="destructive" size="sm" className="w-full" onClick={() => updateCell(section.name, day, time, null)}>
                                                                        <X className="mr-2 h-4 w-4"/> Clear Cell
                                                                    </Button>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                
                 <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handlePublish} disabled={!selectedYear || isPublishing}>
                        {isPublishing ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Upload className="mr-2 h-4 w-4" /> )}
                        Save & Publish
                    </Button>
                     <ScheduleCheckerDialog 
                        schedules={parsedSchedulesForEditor} 
                        onApplyFixes={(newSchedule) => {
                            // This part would need more logic to merge the corrected markdown back into the grid state.
                            // For now, it will replace the whole grid.
                            const parsed = parseMultipleSchedules(newSchedule);
                            if (parsed && parsed[0]) {
                                const newGrid: ScheduleGrid = {};
                                parsed[0].sections.forEach(sec => {
                                    newGrid[sec.sectionName] = {};
                                    sec.rows.forEach(row => {
                                        const day = row[0];
                                        row.slice(1).forEach((cell, index) => {
                                            const time = sec.header[index + 1];
                                            if (cell !== '-') {
                                                const match = cell.match(/(.+) \((.+)\) in (.+)/);
                                                if(match) {
                                                     newGrid[sec.sectionName][`${day}-${time}`] = {
                                                        subject: match[1],
                                                        faculty: match[2],
                                                        room: match[3]
                                                    };
                                                }
                                            }
                                        });
                                    });
                                });
                                setScheduleGrid(newGrid);
                            }
                            toast({ title: "Fixes Applied", description: "The AI's suggestions have been applied." });
                        }}
                    />
                 </div>
            </div>
        </CardContent>
    );
}
