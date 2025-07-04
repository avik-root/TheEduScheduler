
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { CalendarCog, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <CalendarCog className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tighter text-primary">
            EduScheduler <span className="text-lg font-normal text-muted-foreground">by MintFire</span>
          </h1>
          <p className="text-muted-foreground">Admin Portal</p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
      <footer className="absolute bottom-6 w-full text-center">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Shield className="h-4 w-4" />
            Secured by MintFire
        </p>
      </footer>
    </main>
  );
}
