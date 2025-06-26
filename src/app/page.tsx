import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { CalendarCog } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        <div className="space-y-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <CalendarCog className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tighter text-primary">
              EduScheduler
            </h1>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            The Future of Intelligent Scheduling.
          </p>
          <p className="max-w-xl text-lg text-muted-foreground mx-auto md:mx-0">
            Harness the power of AI to create flawless schedules in seconds. EduScheduler intelligently handles complex constraints, optimizes resource allocation, and eliminates conflicts, so you can focus on what truly matters.
          </p>
        </div>

        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <SignupForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
