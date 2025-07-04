import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Shield } from 'lucide-react';

export default function DeveloperPage() {
  const developers = [
    {
      name: 'Anusha',
      role: 'Full Stack Developer',
      bio: 'Anusha is a passionate developer who loves building beautiful and functional web applications. She specializes in Next.js, React, and Tailwind CSS.',
      avatar: 'https://placehold.co/150x150.png',
      hint: 'woman portrait',
    },
    {
      name: 'Rohit',
      role: 'AI & Backend Engineer',
      bio: 'Rohit is an expert in artificial intelligence and backend systems. He designed the core scheduling engine for EduScheduler using Genkit.',
      avatar: 'https://placehold.co/150x150.png',
      hint: 'man portrait',
    },
     {
      name: 'Biswabid',
      role: 'UI/UX Designer',
      bio: 'Biswabid has a keen eye for design and user experience. He created the clean and intuitive interface for EduScheduler using ShadCN UI.',
      avatar: 'https://placehold.co/150x150.png',
      hint: 'person smiling',
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

      <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {developers.map((dev) => (
          <Card key={dev.name} className="text-center">
            <CardHeader>
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full">
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
            <CardContent>
              <CardTitle>{dev.name}</CardTitle>
              <p className="mt-1 text-sm font-medium text-primary">{dev.role}</p>
              <p className="mt-4 text-muted-foreground">{dev.bio}</p>
            </CardContent>
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
