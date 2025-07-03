'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, BrainCircuit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateSchedule, type GenerateScheduleOutput } from '@/ai/flows/generate-schedule';

const ScheduleGeneratorSchema = z.object({
  timeConstraints: z.string().min(1, 'Time constraints are required.'),
  availableRooms: z.coerce.number().min(1, 'At least one room is required.'),
  roomAvailabilityTime: z.string().min(1, 'Room availability time is required.'),
  taskPriorities: z.string().min(1, 'Task priorities are required.'),
});

type FormData = z.infer<typeof ScheduleGeneratorSchema>;

export function AiScheduleGenerator() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedSchedule, setGeneratedSchedule] = React.useState<GenerateScheduleOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(ScheduleGeneratorSchema),
    defaultValues: {
      timeConstraints: '',
      availableRooms: 1,
      roomAvailabilityTime: '',
      taskPriorities: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setGeneratedSchedule(null);
    try {
      const result = await generateSchedule(data);
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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Schedule Generator</CardTitle>
          <CardDescription>
            Harness the power of AI to create flawless schedules in seconds. Input your constraints and let our intelligent system handle the rest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="timeConstraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Constraints</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Classes only between 9 AM and 5 PM, Monday to Friday."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="availableRooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Available Rooms</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomAvailabilityTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Availability Times</FormLabel>
                       <FormControl>
                        <Input placeholder="e.g., 9 AM - 5 PM, Mon-Fri" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="taskPriorities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task/Course Priorities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Calculus 101' is a high priority course. 'Beginner's Yoga' is a low priority."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-fit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="mr-2 h-4 w-4" />
                )}
                Generate Schedule
              </Button>
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
