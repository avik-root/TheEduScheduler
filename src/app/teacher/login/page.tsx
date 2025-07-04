
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeacherLoginForm } from "@/components/auth/teacher-login-form";
import { School, Shield } from 'lucide-react';
import { TypingAnimation } from "@/components/common/typing-animation";

export default function TeacherLoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

        <div className="space-y-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <School className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tighter text-primary">
              EduScheduler <TypingAnimation text="by MintFire" className="text-2xl font-normal text-muted-foreground" />
            </h1>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            The Future of Intelligent Scheduling.
          </p>
          <p className="max-w-xl text-lg text-muted-foreground mx-auto md:mx-0">
            Revolutionize the way you plan with EduScheduler by MintFire — the AI-powered solution that creates perfect schedules in seconds. Effortlessly manage complex constraints, optimize resource allocation, and eliminate conflicts with intelligent automation. Spend less time troubleshooting and more time on what truly matters.
          </p>
        </div>
        
        <Card className="w-full max-w-md mx-auto shadow-lg">
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
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Shield className="h-4 w-4" />
            Secured by MintFire
        </p>
      </footer>
    </main>
  );
}
