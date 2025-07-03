
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeacherLoginForm } from "@/components/auth/teacher-login-form";
import { School } from 'lucide-react';

export default function TeacherLoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <School className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tighter text-primary">
            EduScheduler <span className="text-lg font-normal text-muted-foreground">by MintFire</span>
          </h1>
          <p className="text-muted-foreground">Faculty Portal</p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Faculty Login</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherLoginForm />
          </CardContent>
        </Card>
      </div>
      <footer className="absolute bottom-6 w-full text-center">
        <p className="text-sm font-semibold text-muted-foreground">
            Secured by MintFire
        </p>
      </footer>
    </main>
  );
}
