import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, LogOut, ChevronLeft, Building, Layers, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getBuildingById, type Floor } from '@/lib/buildings';
import { EditBuildingDialog } from '@/components/admin/buildings/edit-building-dialog';
import { DeleteBuildingDialog } from '@/components/admin/buildings/delete-building-dialog';
import { CreateFloorDialog } from '@/components/admin/buildings/create-floor-dialog';

export default async function BuildingFloorsPage({ params, searchParams }: { params: { buildingId: string }, searchParams: { email?: string } }) {
  const admin = searchParams.email ? await getAdminByEmail(searchParams.email) : null;
  const building = await getBuildingById(params.buildingId);

  if (!building) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">
              EduScheduler
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
              {admin?.name || 'Admin'}
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
                        <Link href={`/admin/dashboard/buildings?email=${searchParams.email}`}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Back to Buildings</span>
                        </Link>
                      </Button>
                      <div className="grid gap-1">
                        <CardTitle className="flex items-center gap-2"><Building className="h-6 w-6" /> {building.name}</CardTitle>
                        <CardDescription>Manage floors for this building.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <CreateFloorDialog buildingId={building.id} />
                        <EditBuildingDialog building={building} />
                        <DeleteBuildingDialog buildingId={building.id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {building.floors.map((floor: Floor) => (
                      <Link key={floor.id} href={`/admin/dashboard/buildings/${building.id}/floors/${floor.id}?email=${searchParams.email}`}>
                        <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                            <CardHeader className="flex-row items-center gap-4">
                                <div className="rounded-full bg-primary/10 p-3">
                                  <Layers className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-xl">{floor.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">
                                    {floor.rooms.length} room(s)
                                </p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">Click to manage rooms</p>
                            </CardFooter>
                        </Card>
                      </Link>
                    ))}
                    {building.floors.length === 0 && (
                      <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                        <div className="text-center">
                           <p className="text-muted-foreground">
                            No floors found for this building.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click &apos;Create New Floor&apos; to get started.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
