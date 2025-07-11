
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, User, Mail, Lock, Eye, EyeOff, Building, Clock, Type, ShieldOff, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UpdateFacultySchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateFaculty, type Faculty, isFacultyAbbreviationTaken } from '@/lib/faculty';
import type { Department } from '@/lib/departments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { DisableFaculty2FADialog } from './disable-faculty-2fa-dialog';


type FormData = z.infer<typeof UpdateFacultySchema>;

interface EditFacultyFormProps {
  faculty: Faculty;
  onSuccess?: () => void;
  departments: Department[];
  adminEmail: string;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function EditFacultyForm({ faculty, onSuccess, departments, adminEmail }: EditFacultyFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isCheckingAbbreviation, setIsCheckingAbbreviation] = React.useState(false);
  const abbreviationDebounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(UpdateFacultySchema),
    defaultValues: {
      name: faculty.name,
      abbreviation: faculty.abbreviation || '',
      email: faculty.email,
      department: faculty.department || '',
      weeklyMaxHours: faculty.weeklyMaxHours ?? 40,
      weeklyOffDays: faculty.weeklyOffDays ?? [],
      password: '',
      confirmPassword: '',
      isTwoFactorEnabled: faculty.isTwoFactorEnabled,
      twoFactorAttempts: faculty.twoFactorAttempts,
      isLocked: faculty.isLocked,
    },
  });
  
  const { setError, clearErrors } = form;

  const handleAbbreviationCheck = React.useCallback(async (abbreviation: string) => {
    setIsCheckingAbbreviation(true);
    if (!abbreviation || abbreviation.toLowerCase() === (faculty.abbreviation || '').toLowerCase()) {
      clearErrors("abbreviation");
      setIsCheckingAbbreviation(false);
      return;
    }

    try {
      const isTaken = await isFacultyAbbreviationTaken(abbreviation, faculty.email);
      if (isTaken) {
        setError("abbreviation", { type: "manual", message: "This abbreviation is already in use." });
      } else {
        clearErrors("abbreviation");
      }
    } catch (error) {
       console.error("Abbreviation check failed:", error);
       setError("abbreviation", {type: "manual", message: "Could not verify abbreviation."});
    } finally {
        setIsCheckingAbbreviation(false);
    }
  }, [faculty.email, faculty.abbreviation, setError, clearErrors]);
  
  const debouncedAbbreviationCheck = React.useCallback((abbreviation: string) => {
      if (abbreviationDebounceTimeoutRef.current) {
          clearTimeout(abbreviationDebounceTimeoutRef.current);
      }
      abbreviationDebounceTimeoutRef.current = setTimeout(() => {
          handleAbbreviationCheck(abbreviation);
      }, 500);
  }, [handleAbbreviationCheck]);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    
    const isAbbrTaken = await isFacultyAbbreviationTaken(data.abbreviation, faculty.email);
    if (isAbbrTaken) {
        setError("abbreviation", { type: "manual", message: "This abbreviation is already in use." });
        setIsLoading(false);
        return;
    }

    const result = await updateFaculty(adminEmail, data);

    if (result.success) {
      toast({
        title: 'Faculty Account Updated',
        description: `The account for ${data.name} has been successfully updated.`,
      });
      router.refresh();
      onSuccess?.();
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.message,
      });
    }

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Dr. Alan Grant" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="abbreviation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abbreviation</FormLabel>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                   <Input
                    placeholder="e.g., AG"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      debouncedAbbreviationCheck(e.target.value);
                    }}
                    className="pl-10"
                  />
                </FormControl>
              </div>
               <div className="h-5 pt-1">
                 {isCheckingAbbreviation ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
                    </p>
                ) : (
                    <FormMessage />
                )}
               </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Cannot be changed)</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    className="pl-10 bg-muted"
                    readOnly
                    disabled
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                    </div>
                  </FormControl>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.name}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weeklyMaxHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weekly Max Hours</FormLabel>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 40"
                    {...field}
                    className="pl-10"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weeklyOffDays"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Weekly Off Days</FormLabel>
                <p className="text-sm text-muted-foreground">Select the days the faculty member is typically off.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day}
                    control={form.control}
                    name="weeklyOffDays"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day}
                          className="flex flex-row items-start space-x-3 space-y-0"
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
                          <FormLabel className="font-normal">
                            {day}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        <div className="space-y-4">
             {isChangingPassword ? (
              <div className="space-y-6 rounded-md border p-4">
                 <h3 className="text-sm font-medium text-foreground">Change Password</h3>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter a new password"
                            {...field}
                            className="pl-10 pr-10"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                        >
                          <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            {...field}
                            className="pl-10 pr-10"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                        >
                          <span className="sr-only">{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsChangingPassword(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            )}
        </div>

        <div className="space-y-4">
            <Separator />
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Two-Factor Authentication</FormLabel>
                    <FormDescription>
                        {faculty.isTwoFactorEnabled 
                            ? "2FA is currently enabled for this user."
                            : "2FA is currently disabled for this user."}
                    </FormDescription>
                </div>
                {faculty.isTwoFactorEnabled && (
                    <DisableFaculty2FADialog 
                        faculty={faculty}
                        adminEmail={adminEmail}
                        onSuccess={() => onSuccess?.()}
                    />
                )}
            </FormItem>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || isCheckingAbbreviation}>
          {(isLoading || isCheckingAbbreviation) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
