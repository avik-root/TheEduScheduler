'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
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
import { LoginSchema, TwoFactorSchema } from '@/lib/validators/auth';
import { useToast } from "@/hooks/use-toast";
import { loginAdmin, verifyAdminTwoFactor } from '@/lib/admin';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type LoginFormData = z.infer<typeof LoginSchema>;
type TwoFactorFormData = z.infer<typeof TwoFactorSchema>;

type FormStep = 'credentials' | 'twoFactor' | 'locked';

export function AdminLoginForm() {
  const [step, setStep] = React.useState<FormStep>('credentials');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPin, setShowPin] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(TwoFactorSchema),
    defaultValues: {
        pin: '',
    }
  });


  async function onLoginSubmit(data: LoginFormData) {
    setIsLoading(true);
    
    const result = await loginAdmin(data);

    if (result.success) {
      if (result.requiresTwoFactor) {
        setStep('twoFactor');
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting...",
        });
        router.push(`/admin/dashboard?email=${encodeURIComponent(data.email)}`);
      }
    } else {
      if (result.isLocked) {
        setStep('locked');
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.message,
        });
      }
    }
    setIsLoading(false);
  }

  async function onTwoFactorSubmit(data: TwoFactorFormData) {
    setIsLoading(true);
    
    const email = loginForm.getValues('email');
    const result = await verifyAdminTwoFactor(email, data.pin);

    if (result.success) {
      toast({ title: "Login Successful", description: "Welcome back! Redirecting..." });
      router.push(`/admin/dashboard?email=${encodeURIComponent(email)}`);
    } else {
       if (result.isLocked) {
            setStep('locked');
        } else {
            twoFactorForm.setError('pin', { type: 'manual', message: result.message });
        }
    }
    setIsLoading(false);
  }

  return (
    <>
      {step === 'credentials' && (
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} className="pl-10 pr-10" />
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
        </Form>
      )}

      {step === 'twoFactor' && (
         <Form {...twoFactorForm}>
          <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className="space-y-6">
            <FormField
              control={twoFactorForm.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>6-Digit PIN</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                        <Input 
                            type={showPin ? 'text' : 'password'} 
                            placeholder="••••••" 
                            {...field} 
                            maxLength={6} 
                            pattern="\d{6}"
                            className="pl-10 pr-10"
                            autoComplete="one-time-code"
                        />
                    </FormControl>
                     <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                        >
                        <span className="sr-only">{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify PIN
            </Button>
          </form>
        </Form>
      )}
       {step === 'locked' && (
        <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Account Locked</AlertTitle>
            <AlertDescription>
              This account has been locked due to too many failed login attempts. Please contact a super admin to restore access.
            </AlertDescription>
        </Alert>
      )}
    </>
  );
}
