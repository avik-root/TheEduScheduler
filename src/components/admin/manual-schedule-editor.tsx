'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type GenerateScheduleOutput } from '@/ai/flows/generate-schedule';
import { publishSchedule } from '@/lib/schedule';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Wand } from 'lucide-react';
import type { Department, Program, Year, Section } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import type { Subject } from '@/lib/subjects';
import { ScheduleCheckerDialog } from './schedule-checker-dialog';
import { parseMultipleSchedules, type ParsedSchedule } from './schedule-viewer';

interface ManualScheduleEditorProps {
    generatedSchedule: GenerateScheduleOutput | null;
    setGeneratedSchedule: (schedule: GenerateScheduleOutput | null) => void;
    adminEmail: string;
    departments: Department[];
    faculty: Faculty[];
    subjects: Subject[];
}

export function ManualScheduleEditor({ generatedSchedule, setGeneratedSchedule, adminEmail, departments, faculty, subjects }: ManualScheduleEditorProps) {
    const [isPublishing, setIsPublishing] = React.useState(false);
    const { toast } = useToast();
    const [scheduleContent, setScheduleContent] = React.useState(generatedSchedule?.schedule || '## B. Tech CSE - Year 1\n\n### Section A\n| Day | 09:00-09:50 | 10:00-10:50 | 11:00-11:50 |\n|---|---|---|---|\n| Monday | Subject 1 (FAC1) in Room 101 | - | Subject 2 (FAC2) in Room 102 |\n\n');
    
    React.useEffect(() => {
        setGeneratedSchedule({ schedule: scheduleContent });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scheduleContent]);

    async function handlePublish() {
        if (!scheduleContent) return;
        setIsPublishing(true);
        const result = await publishSchedule(adminEmail, scheduleContent);
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

    const parsedSchedulesForChecker = React.useMemo(() => parseMultipleSchedules(scheduleContent), [scheduleContent]) || [];

    return (
        <CardContent className="pt-6">
            <div className="space-y-4">
                <Textarea 
                    value={scheduleContent}
                    onChange={(e) => setScheduleContent(e.target.value)}
                    placeholder="Enter schedule in Markdown format..."
                    className="min-h-[400px] font-mono text-sm"
                />
                 <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handlePublish} disabled={!scheduleContent || isPublishing}>
                        {isPublishing ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Upload className="mr-2 h-4 w-4" /> )}
                        Save & Publish
                    </Button>
                     <ScheduleCheckerDialog 
                        schedules={parsedSchedulesForChecker} 
                        onApplyFixes={(newSchedule) => setScheduleContent(newSchedule)} 
                    />
                 </div>
            </div>
        </CardContent>
    );
}
