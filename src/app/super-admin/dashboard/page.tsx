import Link from 'next/link';
import { CalendarCog, LogOut, School, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateAdminForm } from '@/components/super-admin/create-admin-form';

export default function SuperAdminDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-950">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:px-6">
        <Link href="/super-admin/dashboard" className="flex items-center gap-3">
          <CalendarCog className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">
            EduScheduler
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
            Super Admin
          </span>
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Manage administrator accounts.</p>
        </div>
        <div className="mx-auto mt-6 w-full max-w-6xl">
          <Card>
            <CardHeader>
              <CardTitle>Create New Admin Account</CardTitle>
              <CardDescription>
                Use this form to create a new administrator account for your institution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateAdminForm />
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="mt-auto border-t bg-white px-4 py-6 dark:border-gray-800 dark:bg-gray-900 md:px-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} EduScheduler. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="#"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <Shield className="h-4 w-4" /> Admin Login
            </Link>
            <Link
              href="#"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <School className="h-4 w-4" /> Teacher Login
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
