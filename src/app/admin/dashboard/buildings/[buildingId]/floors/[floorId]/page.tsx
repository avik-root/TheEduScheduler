
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, LogOut, ChevronLeft, Layers, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getBuildingById } from '@/lib/buildings';
import { AddRoomDialog } from '@/components/admin/buildings/add-room-dialog';
import { EditFloorDialog } from '@/components/admin/buildings/edit-floor-dialog';
import { DeleteFloorDialog } from '@/components/admin/buildings/delete-floor-dialog';
import { RoomsList } from '@/components/admin/buildings/rooms-list';
import { TypingAnimation } from '@/components/common/typing-animation';


export default async function FloorRoomsPage({ params, searchParams }: { params: { buildingId: string, floorId: string }, searchParams: { email?: string } }) {
  const adminEmail = searchParams.email;
  if (!adminEmail) {
    notFound();
  }

  const admin = await getAdminByEmail(adminEmail);
  const building = await getBuildingById(adminEmail, params.buildingId);
  const floor = building?.floors.find(f => f.id === params.floorId);

  if (!building || !floor) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
         <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">
              EduScheduler <TypingAnimation text="by MintFire" className="text-sm font-normal text-muted-foreground" />
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
                        <Link href={`/admin/dashboard/buildings/${building.id}?email=${adminEmail}`}>
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
                        <AddRoomDialog buildingId={building.id} floorId={floor.id} adminEmail={adminEmail} />
                        <EditFloorDialog buildingId={building.id} floor={floor} adminEmail={adminEmail} />
                        <DeleteFloorDialog buildingId={building.id} floorId={floor.id} adminEmail={adminEmail} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RoomsList buildingId={building.id} floorId={floor.id} rooms={floor.rooms} adminEmail={adminEmail} />
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
