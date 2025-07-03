'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRoomRequest, type RoomRequestData } from '@/lib/requests';

const RequestReasonSchema = z.object({
  reason: z.string().min(10, "Please provide a brief reason (min. 10 characters).").max(200, "Reason cannot exceed 200 characters."),
});

type FormData = z.infer<typeof RequestReasonSchema>;

interface RequestRoomDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    adminEmail: string;
    requestData: Omit<RoomRequestData, 'reason'>;
}

export function RequestRoomDialog({ open, onOpenChange, adminEmail, requestData }: RequestRoomDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(RequestReasonSchema),
    defaultValues: {
      reason: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const result = await createRoomRequest(adminEmail, { ...requestData, reason: data.reason });
    if (result.success) {
      toast({
        title: 'Request Submitted',
        description: 'Your room request has been sent to the admin for approval.',
      });
      onOpenChange(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: result.message,
      });
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Room: {requestData.roomName}</DialogTitle>
          <DialogDescription>
            Requesting for {requestData.date} from {requestData.startTime} to {requestData.endTime}. Please provide a reason for this booking.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for Booking</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., Special guest lecture, extra practice session..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
