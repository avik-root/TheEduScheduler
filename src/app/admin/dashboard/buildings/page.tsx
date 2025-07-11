
import Link from 'next/link';
import { LogOut, ChevronLeft, Building2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getAdminByEmail, getFirstAdminEmail } from '@/lib/admin';
import { getBuildings, type Building } from '@/lib/buildings';
import { CreateBuildingDialog } from '@/components/admin/buildings/create-building-dialog';
import { notFound } from 'next/navigation';
import { AppLogo } from '@/components/common/app-logo';

export default async function BuildingsPage({ searchParams }: { searchParams: { email?: string } }) {
  const loggedInAdminEmail = searchParams.email;
  if (!loggedInAdminEmail) {
    notFound();
  }
  
  const loggedInAdmin = await getAdminByEmail(loggedInAdminEmail);
  const primaryAdminEmail = await getFirstAdminEmail();

  if (!primaryAdminEmail) {
    notFound();
  }
  
  const buildings = await getBuildings(primaryAdminEmail);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <AppLogo linkTo={`/admin/dashboard?email=${loggedInAdminEmail}`} />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
              {loggedInAdmin?.name || 'Admin'}
            </span>
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/login">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Link>
            </Button>
          </div>
      </header>
      <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 pt-8">
            <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/dashboard?email=${loggedInAdminEmail}`}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Back to Dashboard</span>
                        </Link>
                      </Button>
                      <div className="grid gap-1">
                        <CardTitle>Manage Buildings</CardTitle>
                        <CardDescription>Add, edit, and remove buildings, floors, and rooms.</CardDescription>
                      </div>
                    </div>
                     <CreateBuildingDialog adminEmail={primaryAdminEmail} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {buildings.map((building: Building) => (
                      <Link key={building.id} href={`/admin/dashboard/buildings/${building.id}?email=${loggedInAdminEmail}`}>
                        <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                            <CardHeader className="flex-row items-center gap-4">
                                <div className="rounded-full bg-primary/10 p-3">
                                  <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-xl">{building.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">
                                    {building.floors.length} floor(s)
                                </p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">Click to manage floors</p>
                            </CardFooter>
                        </Card>
                      </Link>
                    ))}
                    {buildings.length === 0 && (
                      <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                        <div className="text-center">
                           <p className="text-muted-foreground">
                            No buildings found.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click &apos;Create New Building&apos; to get started.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
            </Card>
        </div>
      </main>
       <footer className="mt-auto border-t bg-background px-4 py-4 md:px-6">
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
