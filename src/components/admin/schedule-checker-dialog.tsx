
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Wand } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { suggestScheduleImprovements, type SuggestScheduleImprovementsOutput } from '@/ai/flows/suggest-schedule-improvements';
import type { ParsedSchedule } from './schedule-viewer';
import { schedulesToMarkdown } from './schedule-viewer';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';

interface ScheduleCheckerDialogProps {
    schedules: ParsedSchedule[];
    onApplyFixes: (newScheduleMarkdown: string) => void;
}

export function ScheduleCheckerDialog({ schedules, onApplyFixes }: ScheduleCheckerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedSchedule, setSelectedSchedule] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<SuggestScheduleImprovementsOutput | null>(null);
  const { toast } = useToast();

  const handleCheckSchedule = async () => {
    if (!selectedSchedule) {
      toast({
        variant: "destructive",
        title: "No Schedule Selected",
        description: "Please select a schedule to check.",
      });
      return;
    }
    const scheduleToAnalyze = schedules.find(s => s.programYearTitle === selectedSchedule);
    if (!scheduleToAnalyze) return;

    setIsLoading(true);
    setResult(null);
    try {
      const markdown = schedulesToMarkdown([scheduleToAnalyze]);
      const aiResult = await suggestScheduleImprovements({
        scheduleDetails: markdown,
        constraints: 'Check for faculty conflicts, room conflicts, and section conflicts. Ensure classes are balanced and avoid consecutive theory classes.'
      });
      setResult(aiResult);
    } catch (error) {
      console.error("AI Check failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "An error occurred while analyzing the schedule.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (result?.correctedSchedule) {
        onApplyFixes(result.correctedSchedule);
        setOpen(false);
        toast({
            title: "Fixes Applied",
            description: "The AI's suggestions have been applied to the schedule. Remember to Save & Publish.",
        });
    }
  };


  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if(!isOpen) setResult(null); setOpen(isOpen);}}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand className="mr-2 h-4 w-4" />
          AI Schedule Checker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>AI Schedule Conflict Checker</DialogTitle>
          <DialogDescription>
            Select a schedule to analyze for conflicts and potential improvements.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 space-y-4">
            <div className="flex items-center gap-2">
                <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a program schedule..." />
                    </SelectTrigger>
                    <SelectContent>
                        {schedules.map((s, i) => (
                            <SelectItem key={i} value={s.programYearTitle}>{s.programYearTitle}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button onClick={handleCheckSchedule} disabled={isLoading || !selectedSchedule}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze
                </Button>
            </div>
            
            {result && (
                <div className="pt-4">
                    <Alert>
                        <Wand className="h-4 w-4" />
                        <AlertTitle>AI Analysis Complete</AlertTitle>
                        <AlertDescription>
                            Here are the suggested improvements for your schedule.
                        </AlertDescription>
                    </Alert>
                    <ScrollArea className="h-72 mt-4 rounded-md border p-4 bg-muted/50">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Suggested Improvements:</h4>
                                <pre className="text-sm whitespace-pre-wrap font-sans">{result.suggestedImprovements}</pre>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Rationale:</h4>
                                <p className="text-sm text-muted-foreground">{result.rationale}</p>
                            </div>
                        </div>
                    </ScrollArea>
                    <div className="pt-4 flex justify-end">
                       <Button onClick={handleApply} disabled={!result.correctedSchedule}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Apply Fixes
                        </Button>
                    </div>
                </div>
            )}
            
        </div>
      </DialogContent>
    </Dialog>
  );
}
