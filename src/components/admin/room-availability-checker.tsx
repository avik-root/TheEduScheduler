'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Search, ChevronsUpDown, Check, Calendar as CalendarIcon, Clock, Sparkles, Send } from 'lucide-react';
import { format } from "date-fns"

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { checkRoomAvailability, type CheckRoomAvailabilityOutput, type CheckRoomAvailabilityInput } from '@/ai/flows/check-room-availability';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import type { Room } from '@/lib/buildings';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { RequestRoomDialog } from '../teacher/request-room-dialog';
import type { RoomRequestData } from '@/lib/requests';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const AdminCheckerSchema = z.object({
  roomsToCheck: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'You have to select at least one room to check.',
  }),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  days: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one day.',
  }),
});

const FacultyCheckerSchema = z.object({
  roomsToCheck: z.array(z.string()).refine((value) => value.length > 0, {
    message: 'You have to select at least one room to check.',
  }),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  date: z.date({
    required_error: "A date is required.",
  }),
});

type FormData = z.infer<typeof AdminCheckerSchema> | z.infer<typeof FacultyCheckerSchema>;

interface RoomAvailabilityCheckerProps {
    userRole: 'admin' | 'faculty';
    allRooms: Room[];
    schedule: string;
    adminEmail: string;
    facultyInfo?: {
        email: string;
        name: string;
    };
}

export function RoomAvailabilityChecker({ userRole, allRooms, schedule, adminEmail, facultyInfo }: RoomAvailabilityCheckerProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [availabilityResult, setAvailabilityResult] = React.useState<CheckRoomAvailabilityOutput | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = React.useState(false);
  const [currentRequestData, setCurrentRequestData] = React.useState<Omit<RoomRequestData, 'reason'> | null>(null);
  const { toast } = useToast();
  
  const isFaculty = userRole === 'faculty';
  const form = useForm<FormData>({
    resolver: zodResolver(isFaculty ? FacultyCheckerSchema : AdminCheckerSchema),
    defaultValues: isFaculty
      ? { roomsToCheck: [], startTime: '10:00', endTime: '11:00', date: new Date() }
      : { roomsToCheck: [], startTime: '10:00', endTime: '11:00', days: ['Monday'] },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setAvailabilityResult(null);

    let input: CheckRoomAvailabilityInput;

    if ('date' in data && data.date) {
        input = {
            ...data,
            date: format(data.date, 'yyyy-MM-dd'),
            schedule
        };
    } else if ('days' in data) {
         input = {
            ...data,
            days: data.days,
            schedule,
        };
    } else {
        toast({ variant: 'destructive', title: 'Invalid Form Data' });
        setIsLoading(false);
        return;
    }

    try {
      const result = await checkRoomAvailability(input);
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

  const handleRequestClick = (roomName: string) => {
    if (!facultyInfo) return;
    const values = form.getValues();
    if ('date' in values && values.date) {
        setCurrentRequestData({
            facultyEmail: facultyInfo.email,
            facultyName: facultyInfo.name,
            roomName,
            date: format(values.date, 'PPP'),
            startTime: values.startTime,
            endTime: values.endTime,
        });
        setRequestDialogOpen(true);
    }
  };
  
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
    <>
    <Card>
      <CardHeader>
        <CardTitle>{isFaculty ? 'Request a Room' : 'Room Availability Checker'}</CardTitle>
        <CardDescription>
          {isFaculty 
            ? 'Check room availability for a specific date and time for a temporary booking.'
            : 'Check room availability against the currently generated schedule. First, generate a schedule, then use this tool to query it.'}
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
                  <FormLabel>Availability Time & {isFaculty ? 'Date' : 'Days'}</FormLabel>
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
                    {isFaculty ? (
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel className="text-xs text-muted-foreground flex items-center gap-2 mb-2"><CalendarIcon className="h-3 w-3" /> Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value as Date | undefined}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date < new Date(new Date().setHours(0,0,0,0))
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <>
                        <FormLabel className="text-xs text-muted-foreground flex items-center gap-2 mb-2"><CalendarIcon className="h-3 w-3" /> Available Days</FormLabel>
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
                                            const currentDays = Array.isArray(field.value) ? field.value : [];
                                            return checked
                                                ? field.onChange([...currentDays, day])
                                                : field.onChange(currentDays?.filter((value) => value !== day))
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
                      </>
                    )}
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
                            {isFaculty && <TableHead className="text-right">Action</TableHead>}
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
                                    {isFaculty && (
                                        <TableCell className="text-right">
                                            {room.status === 'Available' && (
                                                <Button size="sm" onClick={() => handleRequestClick(room.name)}>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Request
                                                </Button>
                                            )}
                                        </TableCell>
                                    )}
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
    {currentRequestData && (
        <RequestRoomDialog
            open={requestDialogOpen}
            onOpenChange={setRequestDialogOpen}
            adminEmail={adminEmail}
            requestData={currentRequestData}
        />
    )}
    </>
  );
}
