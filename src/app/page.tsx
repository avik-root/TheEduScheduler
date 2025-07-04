
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { CalendarCog, Terminal, Shield } from 'lucide-react';
import { checkSuperAdminExists } from "@/lib/super-admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TypingAnimation } from "@/components/common/typing-animation";

export default async function Home() {
  const superAdminExists = await checkSuperAdminExists();

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        <div className="space-y-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <CalendarCog className="h-10 w-10 text-primary" />
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
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup" disabled={superAdminExists}>Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                {superAdminExists ? (
                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Sign Up Disabled</AlertTitle>
                    <AlertDescription>
                      A super admin account already exists for this instance. Please log in.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <SignupForm />
                )}
              </TabsContent>
            </Tabs>
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
