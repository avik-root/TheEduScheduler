
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EditPageContentForm } from '@/components/super-admin/developer/edit-page-content-form';
import type { DeveloperPageContent } from '@/lib/developer';
import { FilePenLine } from 'lucide-react';

interface EditPageContentDialogProps {
  content: DeveloperPageContent;
}

export function EditPageContentDialog({ content }: EditPageContentDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FilePenLine className="h-4 w-4 mr-2" />
          Edit Content
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Page Content</DialogTitle>
          <DialogDescription>
            Modify the text content displayed on the developer page.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <EditPageContentForm content={content} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
