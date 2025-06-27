import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, LogOut, ChevronLeft, Layers, DoorOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getBuildingById, type Room } from '@/lib/buildings';
import { AddRoomDialog } from '@/components/admin/buildings/add-room-dialog';
import { EditFloorDialog } from '@/components/admin/buildings/edit-floor-dialog';
import { DeleteFloorDialog } from '@/components/admin/buildings/delete-floor-dialog';
import { EditRoomDialog } from '@/components/admin/buildings/edit-room-dialog';
import { DeleteRoomDialog } from '@/components/admin/buildings/delete-room-dialog';


export default async function FloorRoomsPage({ params, searchParams }: { params: { buildingId: string, floorId: string }, searchParams: { email?: string } }) {
  const admin = searchParams.email ? await getAdminByEmail(searchParams.email) : null;
  const building = await getBuildingById(params.buildingId);
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
                        <Link href={`/admin/dashboard/buildings/${building.id}?email=${searchParams.email}`}>
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
                        <AddRoomDialog buildingId={building.id} floorId={floor.id} />
                        <EditFloorDialog buildingId={building.id} floor={floor} />
                        <DeleteFloorDialog buildingId={building.id} floorId={floor.id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                     {floor.rooms.map((room: Room) => (
                      <Card key={room.id} className="h-full flex flex-col">
                        <CardHeader className="flex-grow">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-xl">
                              <DoorOpen className="h-5 w-5 text-muted-foreground" />
                              {room.name}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                              <EditRoomDialog buildingId={building.id} floorId={floor.id} room={room} />
                              <DeleteRoomDialog buildingId={building.id} floorId={floor.id} roomId={room.id} />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>Capacity: {room.capacity}</span>
                            </div>
                        </CardContent>
                      </Card>
                    ))}
                    {floor.rooms.length === 0 && (
                      <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                        <div className="text-center">
                           <p className="text-muted-foreground">
                            No rooms found for this floor.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click &apos;Add New Room&apos; to get started.
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
