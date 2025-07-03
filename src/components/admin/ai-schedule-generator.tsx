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
import { Checkbox } from '@/components/ui/checkbox';
import type { Room } from '@/lib/buildings';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const ScheduleGeneratorSchema = z.object({
  timeConstraints: z.string().min(1, 'Time constraints are required.'),
  roomAvailability: z.object({
    startTime: z.string().min(1, 'Start time is required.'),
    endTime: z.string().min(1, 'End time is required.'),
    days: z.array(z.string()).refine((value) => value.some((item) => item), {
        message: "You have to select at least one day.",
    }),
  }),
  theoryPriorities: z.string().min(1, 'Theory priorities are required.'),
  labPriorities: z.string().min(1, 'Lab priorities are required.'),
});

type FormData = z.infer<typeof ScheduleGeneratorSchema>;

interface AiScheduleGeneratorProps {
    allRooms: Room[];
    generatedSchedule: GenerateScheduleOutput | null;
    setGeneratedSchedule: (schedule: GenerateScheduleOutput | null) => void;
}

export function AiScheduleGenerator({ allRooms, generatedSchedule, setGeneratedSchedule }: AiScheduleGeneratorProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(ScheduleGeneratorSchema),
    defaultValues: {
      timeConstraints: 'Classes only between 9 AM and 5 PM. Lunch break from 1 PM to 2 PM.',
      roomAvailability: {
        startTime: '09:00',
        endTime: '17:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      },
      theoryPriorities: 'High priority: Calculus 101, Physics 101. Medium priority: History 202.',
      labPriorities: 'High priority: Chemistry Lab. Must be in a lab room. Low priority: Computer Lab session.',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setGeneratedSchedule(null);
    try {
      const result = await generateSchedule({
          ...data,
          availableRooms: allRooms.map(room => room.name),
      });
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <FormField
                control={form.control}
                name="timeConstraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Global Time Constraints</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Lunch break from 1 PM to 2 PM."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="roomAvailability"
                  render={() => (
                     <FormItem>
                        <FormLabel>Room Availability Times</FormLabel>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="roomAvailability.startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Start Time</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="roomAvailability.endTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">End Time</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                             />
                        </div>
                         <div className="pt-2">
                            <FormLabel className="text-xs text-muted-foreground">Available Days</FormLabel>
                             <div className="grid grid-cols-3 gap-2 rounded-lg border p-2 sm:grid-cols-4">
                                {daysOfWeek.map((day) => (
                                  <FormField
                                    key={day}
                                    control={form.control}
                                    name="roomAvailability.days"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={day}
                                          className="flex flex-row items-start space-x-2 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(day)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...(field.value || []), day])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== day
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal">
                                            {day}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                            <FormMessage>{form.formState.errors.roomAvailability?.days?.message}</FormMessage>
                        </div>
                     </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="theoryPriorities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theory Course Priorities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Calculus 101' is a high priority course."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="labPriorities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab/Practical Course Priorities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Chemistry Lab' requires a wet lab and is high priority."
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
