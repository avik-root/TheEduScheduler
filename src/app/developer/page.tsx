import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ChevronLeft, Shield, Mail, Github, Linkedin } from 'lucide-react';
import { getDevelopers } from '@/lib/developer';

export default async function DeveloperPage() {
  const developers = await getDevelopers();

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center bg-muted/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Button asChild variant="outline">
          <Link href="/teacher/login">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Faculty Login
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-5xl space-y-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-primary sm:text-5xl">About MintFire</h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground md:text-xl">
            At MintFire, we believe in the power of intelligent automation to solve complex problems. We are a passionate team of developers and engineers dedicated to creating innovative solutions that are both powerful and user-friendly. Our flagship product, EduScheduler, is a testament to this commitment, revolutionizing academic scheduling with cutting-edge AI.
          </p>
        </div>

        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter text-primary sm:text-4xl">
              Meet the Team
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              The minds behind{' '}
              <span className="font-semibold">
                 <span className="text-red-500">Mint</span><span className="text-green-500">Fire</span>
              </span>
              .
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
            {developers.map((dev) => (
              <Card key={dev.id} className="flex flex-col text-center bg-card shadow-lg overflow-hidden">
                <CardHeader className="p-0">
                   <div className="relative aspect-[4/5] w-full">
                    <Image
                      src={dev.avatar}
                      alt={`Avatar of ${dev.name}`}
                      fill
                      data-ai-hint={dev.hint}
                      className="object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pt-6">
                  <CardTitle className="text-2xl">{dev.name}</CardTitle>
                  <p className="mt-1 text-base font-medium text-primary">{dev.role}</p>
                  <p className="mt-4 text-muted-foreground">{dev.bio}</p>
                </CardContent>
                <CardFooter className="mt-auto flex justify-center gap-4 border-t pt-6">
                  <Button asChild variant="ghost" size="icon">
                    <a href={dev.links.email} aria-label={`${dev.name}'s Email`}>
                      <Mail className="h-6 w-6" />
                    </a>
                  </Button>
                  <Button asChild variant="ghost" size="icon">
                    <a href={dev.links.github} target="_blank" rel="noopener noreferrer" aria-label={`${dev.name}'s GitHub`}>
                      <Github className="h-6 w-6" />
                    </a>
                  </Button>
                  <Button asChild variant="ghost" size="icon">
                    <a href={dev.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${dev.name}'s LinkedIn`}>
                      <Linkedin className="h-6 w-6" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="w-full pt-20 pb-6 text-center">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Shield className="h-4 w-4" />
            Secured by MintFire
        </p>
      </footer>
    </main>
  );
}
