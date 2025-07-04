'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, User, Mail, Lock, Eye, EyeOff, Building, Clock, Type } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreateFacultyFormSchema, type FacultySchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { createFaculty, isFacultyEmailTaken, isFacultyAbbreviationTaken } from '@/lib/faculty';
import { Checkbox } from '@/components/ui/checkbox';
import type { Department } from '@/lib/departments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormData = z.infer<typeof CreateFacultyFormSchema>;
type FacultyData = z.infer<typeof FacultySchema>;

interface CreateFacultyFormProps {
  onSuccess?: () => void;
  departments: Department[];
  adminEmail: string;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EMAIL_DOMAIN = '@themintfire.com';

export function CreateFacultyForm({ onSuccess, departments, adminEmail }: CreateFacultyFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);
  const [isCheckingAbbreviation, setIsCheckingAbbreviation] = React.useState(false);
  const emailDebounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const abbreviationDebounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(CreateFacultyFormSchema),
    defaultValues: {
      name: '',
      abbreviation: '',
      email: '',
      password: '',
      department: '',
      weeklyMaxHours: 40,
      weeklyOffDays: [],
    },
    mode: 'onTouched',
  });

  const { setError, clearErrors } = form;

  const handleEmailCheck = React.useCallback(async (username: string) => {
    setIsCheckingEmail(true);
    if (!username) {
      clearErrors("email");
      setIsCheckingEmail(false);
      return;
    }

    const fullEmail = `${username}${EMAIL_DOMAIN}`;
    try {
      const isTaken = await isFacultyEmailTaken(fullEmail);
      if (isTaken) {
        setError("email", { type: "manual", message: "This email is already taken." });
      } else {
        clearErrors("email");
      }
    } catch (error) {
       console.error("Email check failed:", error);
       setError("email", {type: "manual", message: "Could not verify email."});
    } finally {
        setIsCheckingEmail(false);
    }
  }, [setError, clearErrors]);
  
  const debouncedEmailCheck = React.useCallback((username: string) => {
      if (emailDebounceTimeoutRef.current) {
          clearTimeout(emailDebounceTimeoutRef.current);
      }
      emailDebounceTimeoutRef.current = setTimeout(() => {
          handleEmailCheck(username);
      }, 500);
  }, [handleEmailCheck]);
  
  const handleAbbreviationCheck = React.useCallback(async (abbreviation: string) => {
    setIsCheckingAbbreviation(true);
    if (!abbreviation) {
      clearErrors("abbreviation");
      setIsCheckingAbbreviation(false);
      return;
    }

    try {
      const isTaken = await isFacultyAbbreviationTaken(abbreviation);
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
  }, [setError, clearErrors]);
  
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

    const fullEmail = `${data.email}${EMAIL_DOMAIN}`;
    
    const [isEmailTakenResult, isAbbrTakenResult] = await Promise.all([
        isFacultyEmailTaken(fullEmail),
        isFacultyAbbreviationTaken(data.abbreviation)
    ]);

    let hasError = false;
    if (isEmailTakenResult) {
        setError("email", { type: "manual", message: "This email is already taken." });
        hasError = true;
    }
     if (isAbbrTakenResult) {
        setError("abbreviation", { type: "manual", message: "This abbreviation is already in use." });
        hasError = true;
    }

    if(hasError) {
        setIsLoading(false);
        return;
    }

    const submissionData: FacultyData = { ...data, email: fullEmail };

    const result = await createFaculty(adminEmail, submissionData);

    if (result.success) {
      toast({
        title: 'Faculty Account Created',
        description: `An account for ${data.name} has been successfully created.`,
      });
      form.reset();
      router.refresh();
      onSuccess?.();
    } else {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
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
              <FormLabel>Email</FormLabel>
               <div className="flex items-center">
                    <div className="relative flex-grow">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input
                                placeholder="username"
                                {...field}
                                onChange={(e) => {
                                    field.onChange(e);
                                    debouncedEmailCheck(e.target.value);
                                }}
                                className="pl-10 rounded-r-none focus:ring-0 focus:z-10"
                            />
                        </FormControl>
                    </div>
                    <span className="inline-flex h-10 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                        {EMAIL_DOMAIN}
                    </span>
                </div>
                <div className="h-5 pt-1">
                 {isCheckingEmail ? (
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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
        <Button type="submit" className="w-full" disabled={isLoading || isCheckingEmail || isCheckingAbbreviation}>
          {(isLoading || isCheckingEmail || isCheckingAbbreviation) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Faculty Account
        </Button>
      </form>
    </Form>
  );
}
