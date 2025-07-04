import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ChevronLeft, Shield, Mail, Github, Linkedin } from 'lucide-react';

export default function DeveloperPage() {
  const developers = [
    {
      name: 'Anusha Gupta',
      role: 'Full Stack Developer',
      bio: 'Anusha is a passionate developer who loves building beautiful and functional web applications. She specializes in Next.js, React, and Tailwind CSS.',
      avatar: 'https://placehold.co/150x150.png',
      hint: 'woman portrait',
      links: {
        email: 'mailto:anusha.gupta@example.com',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com/in/',
      },
    },
    {
      name: 'Avik Samanta',
      role: 'AI & Backend Engineer',
      bio: 'Avik is an expert in artificial intelligence and backend systems. He designed the core scheduling engine for EduScheduler using Genkit.',
      avatar: 'https://placehold.co/150x150.png',
      hint: 'man portrait',
       links: {
        email: 'mailto:avik.samanta@example.com',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com/in/',
      },
    },
  ];

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Button asChild variant="outline">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tighter text-primary">
          Meet the Team
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The minds behind{' '}
          <span className="font-semibold">
             <span className="text-red-500">Mint</span><span className="text-green-500">Fire</span>
          </span>
          .
        </p>
      </div>

      <div className="mt-16 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
        {developers.map((dev) => (
          <Card key={dev.name} className="flex flex-col text-center">
            <CardHeader>
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-4 border-primary/20">
                <Image
                  src={dev.avatar}
                  alt={`Avatar of ${dev.name}`}
                  width={150}
                  height={150}
                  data-ai-hint={dev.hint}
                  className="h-full w-full object-cover"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardTitle className="text-2xl">{dev.name}</CardTitle>
              <p className="mt-1 text-base font-medium text-primary">{dev.role}</p>
              <p className="mt-4 text-muted-foreground">{dev.bio}</p>
            </CardContent>
            <CardFooter className="mt-auto flex justify-center gap-4 border-t pt-4">
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

      <footer className="absolute bottom-6 w-full text-center">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Shield className="h-4 w-4" />
            Secured by MintFire
        </p>
      </footer>
    </main>
  );
}
