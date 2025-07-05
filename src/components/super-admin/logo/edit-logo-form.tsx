
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
import { LogoSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateLogo } from '@/lib/logo';

type FormData = z.infer<typeof LogoSchema>;

interface EditLogoFormProps {
  currentLogo: string | null;
  onSuccess?: () => void;
}

export function EditLogoForm({ currentLogo, onSuccess }: EditLogoFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(currentLogo);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(LogoSchema),
    defaultValues: {
      logo: currentLogo || '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      form.setError('logo', { type: 'manual', message: 'Only PNG files are allowed.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a file smaller than 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      form.setValue('logo', base64String, { shouldValidate: true, shouldDirty: true });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };


  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const result = await updateLogo(data);

    if (result.success) {
      toast({
        title: 'Logo Updated',
        description: 'The application logo has been successfully updated.',
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
        <FormItem>
          <FormLabel>Logo Preview</FormLabel>
            <div className="relative mx-auto flex h-24 w-full items-center justify-center rounded-lg border bg-muted">
                {imagePreview ? (
                    <Image src={imagePreview} alt="Logo preview" fill className="object-contain" />
                ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-xs">No logo set</span>
                    </div>
                )}
            </div>
          <FormControl>
            <Button type="button" variant="outline" className="w-full mt-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Upload New Logo
            </Button>
          </FormControl>
          <Input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png"
            onChange={handleFileChange} 
          />
          <p className="text-xs text-muted-foreground">PNG file, up to 2MB recommended.</p>
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
                <Input {...field} type="hidden" />
            )}
          />
          <FormMessage>{form.formState.errors.logo?.message}</FormMessage>
        </FormItem>

        <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isDirty}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
