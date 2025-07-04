'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Loader2, User, Briefcase, Mail, Github, Linkedin, Image as ImageIcon, Upload } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { DeveloperSchema } from '@/lib/validators/auth';
import { useToast } from '@/hooks/use-toast';
import { updateDeveloper, type Developer } from '@/lib/developer';

type FormData = z.infer<typeof DeveloperSchema>;

interface EditDeveloperFormProps {
  developer: Developer;
  onSuccess?: () => void;
}

export function EditDeveloperForm({ developer, onSuccess }: EditDeveloperFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(developer.avatar);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(DeveloperSchema),
    defaultValues: {
      ...developer,
      email: developer.links.email,
      github: developer.links.github,
      linkedin: developer.links.linkedin,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please upload a JPG or PNG file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a file smaller than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      form.setValue('avatar', base64String, { shouldValidate: true, shouldDirty: true });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };


  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const updatedDeveloperData: Developer = {
      id: data.id,
      name: data.name,
      role: data.role,
      bio: data.bio,
      avatar: data.avatar,
      hint: data.hint,
      links: {
        email: data.email,
        github: data.github,
        linkedin: data.linkedin,
      },
    };

    const result = await updateDeveloper(updatedDeveloperData);

    if (result.success) {
      toast({
        title: 'Profile Updated',
        description: `The profile for ${data.name} has been successfully updated.`,
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
                  <Input {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
               <FormControl>
                  <Textarea {...field} />
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Avatar</FormLabel>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[240px] overflow-hidden rounded-lg border bg-muted">
                {imagePreview ? (
                    <Image src={imagePreview} alt="Avatar preview" fill className="object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10" />
                    </div>
                )}
            </div>
          <FormControl>
            <Button type="button" variant="outline" className="w-full mt-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Upload Image
            </Button>
          </FormControl>
          <Input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg"
            onChange={handleFileChange} 
          />
          <p className="text-xs text-muted-foreground">PNG or JPG file, up to 5MB.</p>
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
                <Input {...field} type="hidden" />
            )}
          />
          <FormMessage>{form.formState.errors.avatar?.message}</FormMessage>
        </FormItem>

        <div className="space-y-2">
            <h3 className="text-sm font-medium">Social Links</h3>
            <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="sr-only">Email</FormLabel>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input {...field} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="github"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="sr-only">GitHub</FormLabel>
                        <div className="relative">
                            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input {...field} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="sr-only">LinkedIn</FormLabel>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                            <Input {...field} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
