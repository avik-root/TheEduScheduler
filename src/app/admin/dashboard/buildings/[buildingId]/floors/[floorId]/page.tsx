
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LogOut, ChevronLeft, Layers, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail, getFirstAdminEmail } from '@/lib/admin';
import { getBuildingById } from '@/lib/buildings';
import { AddRoomDialog } from '@/components/admin/buildings/add-room-dialog';
import { EditFloorDialog } from '@/components/admin/buildings/edit-floor-dialog';
import { DeleteFloorDialog } from '@/components/admin/buildings/delete-floor-dialog';
import { RoomsList } from '@/components/admin/buildings/rooms-list';
import { AppLogo } from '@/components/common/app-logo';


export default async function FloorRoomsPage({ params, searchParams }: { params: { buildingId: string, floorId: string }, searchParams: { email?: string } }) {
  const loggedInAdminEmail = searchParams.email;
  if (!loggedInAdminEmail) {
    notFound();
  }

  const loggedInAdmin = await getAdminByEmail(loggedInAdminEmail);
  const primaryAdminEmail = await getFirstAdminEmail();

  if (!primaryAdminEmail) {
    notFound();
  }
  
  const building = await getBuildingById(primaryAdminEmail, params.buildingId);
  const floor = building?.floors.find(f => f.id === params.floorId);

  if (!building || !floor) {
    notFound();
  }

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
                        <Link href={`/admin/dashboard/buildings/${building.id}?email=${loggedInAdminEmail}`}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Back to Floors</span>
                        </Link>
                      </Button>
                      <div className="grid gap-1">
                        <CardTitle className="flex items-center gap-2"><Layers className="h-6 w-6" /> {floor.name}</CardTitle>
                        <CardDescription>Manage rooms for this floor in {building.name}.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <AddRoomDialog buildingId={building.id} floorId={floor.id} adminEmail={primaryAdminEmail} />
                        <EditFloorDialog buildingId={building.id} floor={floor} adminEmail={primaryAdminEmail} />
                        <DeleteFloorDialog buildingId={building.id} floorId={floor.id} adminEmail={primaryAdminEmail} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RoomsList buildingId={building.id} floorId={floor.id} rooms={floor.rooms} adminEmail={primaryAdminEmail} />
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
