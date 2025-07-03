'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Search, ChevronsUpDown, Check, Calendar, Clock, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { checkRoomAvailability, type CheckRoomAvailabilityOutput } from '@/ai/flows/check-room-availability';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import type { Room } from '@/lib/buildings';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const AvailabilityCheckerSchema = z.object({
  roomsToCheck: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'You have to select at least one room to check.',
  }),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  days: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one day.',
  }),
});

type FormData = z.infer<typeof AvailabilityCheckerSchema>;

interface RoomAvailabilityCheckerProps {
    allRooms: Room[];
    schedule: string;
}

export function RoomAvailabilityChecker({ allRooms, schedule }: RoomAvailabilityCheckerProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [availabilityResult, setAvailabilityResult] = React.useState<CheckRoomAvailabilityOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(AvailabilityCheckerSchema),
    defaultValues: {
      roomsToCheck: [],
      startTime: '10:00',
      endTime: '11:00',
      days: ['Monday'],
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setAvailabilityResult(null);
    try {
      const result = await checkRoomAvailability({ ...data, schedule });
      setAvailabilityResult(result);
      toast({
        title: 'Availability Checked',
        description: 'The AI has completed the availability check.',
      });
    } catch (error) {
      console.error('Failed to check availability:', error);
      toast({
        variant: 'destructive',
        title: 'Check Failed',
        description: 'An error occurred while checking room availability.',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'Unavailable':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'Partially Available':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Availability Checker</CardTitle>
        <CardDescription>
          Check room availability against the currently generated schedule. First, generate a schedule, then use this tool to query it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="roomsToCheck"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Rooms to Check</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-auto min-h-10",
                              !field.value?.length && "text-muted-foreground"
                            )}
                          >
                            <div className="flex flex-wrap gap-1">
                              {field.value?.length > 0 ? (
                                field.value.map((roomName) => (
                                  <Badge
                                    key={roomName}
                                    variant="secondary"
                                  >
                                    {roomName}
                                  </Badge>
                                ))
                              ) : (
                                "Select rooms to check..."
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search rooms..." />
                           <CommandList>
                            <CommandEmpty>No rooms found.</CommandEmpty>
                            <CommandGroup>
                              {allRooms.map((room) => (
                                <CommandItem
                                  key={room.id}
                                  value={room.name}
                                  onSelect={() => {
                                    const selected = field.value || [];
                                    const isSelected = selected.includes(room.name);
                                    const newSelected = isSelected
                                      ? selected.filter((r) => r !== room.name)
                                      : [...selected, room.name];
                                    field.onChange(newSelected);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      (field.value || []).includes(room.name)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {room.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                  <FormLabel>Availability Time & Days</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> Start Time</FormLabel>
                                  <FormControl>
                                      <Input type="time" {...field} />
                                  </FormControl>
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> End Time</FormLabel>
                                  <FormControl>
                                      <Input type="time" {...field} />
                                  </FormControl>
                              </FormItem>
                          )}
                          />
                  </div>
                      <div className="pt-2">
                      <FormLabel className="text-xs text-muted-foreground flex items-center gap-2 mb-2"><Calendar className="h-3 w-3" /> Available Days</FormLabel>
                          <div className="grid grid-cols-3 gap-2 rounded-lg border p-2 sm:grid-cols-4">
                          {daysOfWeek.map((day) => (
                              <FormField
                              key={day}
                              control={form.control}
                              name="days"
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
                      <FormMessage>{form.formState.errors.days?.message}</FormMessage>
                  </div>
              </FormItem>
            </div>

            <Button type="submit" className="w-fit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Check Availability
            </Button>
          </form>
        </Form>
        
        <Separator />

        <div>
          <h3 className="text-lg font-medium">Availability Results</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The table below shows the availability status of the selected rooms.
          </p>
          {isLoading ? (
              <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
          ) : availabilityResult ? (
            <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3 text-sm font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                    <Sparkles className="h-5 w-5" />
                    <p>{availabilityResult.summary}</p>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Room</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {availabilityResult.availability.map((room) => (
                                <TableRow key={room.name}>
                                    <TableCell className="font-medium">{room.name}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("text-xs", getStatusColor(room.status))}>
                                            {room.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{room.reason || '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border bg-muted">
              <p className="text-muted-foreground">Availability results will appear here...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
