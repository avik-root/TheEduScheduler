
import Link from 'next/link';
import { CalendarCog, LogOut, School, Shield, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAdmins, type Admin } from '@/lib/admin';
import { CreateAdminDialog } from '@/components/super-admin/create-admin-dialog';
import { EditAdminDialog } from '@/components/super-admin/edit-admin-dialog';
import { DeleteAdminDialog } from '@/components/super-admin/delete-admin-dialog';
import { TypingAnimation } from '@/components/common/typing-animation';

export default async function SuperAdminDashboardPage() {
  const admins = await getAdmins();

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-950">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:px-6">
        <Link href="/super-admin/dashboard" className="flex items-center gap-3">
          <CalendarCog className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">
            EduScheduler <TypingAnimation text="by MintFire" className="text-sm font-normal text-muted-foreground" />
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
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Admin Management</h1>
              <p className="text-muted-foreground">
                Create and manage administrator accounts.
              </p>
            </div>
            <CreateAdminDialog />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {admins.map((admin: Admin) => (
              <Card key={admin.email}>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{admin.name}</CardTitle>
                      <CardDescription>{admin.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <EditAdminDialog admin={admin} />
                    <DeleteAdminDialog admin={admin} />
                  </div>
                </CardHeader>
              </Card>
            ))}
            {admins.length === 0 && (
              <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No admin accounts found.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click &apos;Create New Admin&apos; to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="mt-auto border-t bg-white px-4 py-6 dark:border-gray-800 dark:bg-gray-900 md:px-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} EduScheduler. All rights reserved.
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Shield className="h-4 w-4" />
            Secured by MintFire
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/admin/login"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <Shield className="h-4 w-4" /> Admin Login
            </Link>
            <Link
              href="/teacher/login"
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
