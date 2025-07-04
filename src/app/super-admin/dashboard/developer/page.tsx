
import Link from 'next/link';
import { CalendarCog, LogOut, Shield, ChevronLeft, BookUser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDevelopers, type Developer, getDeveloperPageContent } from '@/lib/developer';
import { EditDeveloperDialog } from '@/components/super-admin/developer/edit-developer-dialog';
import Image from 'next/image';
import { EditPageContentDialog } from '@/components/super-admin/developer/edit-page-content-dialog';

export default async function DeveloperSettingsPage() {
    const developers = await getDevelopers();
    const pageContent = await getDeveloperPageContent();

    return (
        <div className="flex min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-950">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:px-6">
                <Link href="/super-admin/dashboard" className="flex items-center gap-3">
                    <CalendarCog className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold text-primary">
                        EduScheduler <span className="text-sm font-normal text-muted-foreground">by MintFire</span>
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
                    <div className="mb-8 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/super-admin/dashboard`}>
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="sr-only">Back to Dashboard</span>
                                </Link>
                            </Button>
                            <div className="grid gap-1">
                                <h1 className="text-3xl font-semibold flex items-center gap-2"><BookUser /> Developer Page Management</h1>
                                <p className="text-muted-foreground">
                                    Modify the content displayed on the public developer page.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card className="mb-8">
                        <CardHeader className="flex-row items-center justify-between">
                            <div className="grid gap-1">
                                <CardTitle>Page Content</CardTitle>
                                <CardDescription>Edit the introductory text on the developer page.</CardDescription>
                            </div>
                            <EditPageContentDialog content={pageContent} />
                        </CardHeader>
                    </Card>

                    <div className="mb-4">
                        <h2 className="text-2xl font-semibold">Developer Profiles</h2>
                        <p className="text-muted-foreground">Modify individual developer profiles.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {developers.map((dev: Developer) => (
                            <Card key={dev.id} className="flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between gap-4">
                                     <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary/20">
                                            <Image
                                                src={dev.avatar}
                                                alt={`Avatar of ${dev.name}`}
                                                width={64}
                                                height={64}
                                                data-ai-hint={dev.hint}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{dev.name}</CardTitle>
                                            <CardDescription>{dev.role}</CardDescription>
                                        </div>
                                    </div>
                                    <EditDeveloperDialog developer={dev} />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{dev.bio}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
            <footer className="mt-auto border-t bg-white px-4 py-6 dark:border-gray-800 dark:bg-gray-900 md:px-6">
                 <div className="container mx-auto flex items-center justify-center">
                    <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        Secured by MintFire
                    </p>
                </div>
            </footer>
        </div>
    );
}
