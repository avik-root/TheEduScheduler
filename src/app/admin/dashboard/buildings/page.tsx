import Link from 'next/link';
import { CalendarDays, LogOut, ChevronLeft, Building, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminByEmail } from '@/lib/admin';
import { getBuildings, type Building } from '@/lib/buildings';
import { CreateBuildingDialog } from '@/components/admin/buildings/create-building-dialog';
import { EditBuildingDialog } from '@/components/admin/buildings/edit-building-dialog';
import { DeleteBuildingDialog } from '@/components/admin/buildings/delete-building-dialog';
import { AddRoomDialog } from '@/components/admin/buildings/add-room-dialog';
import { EditRoomDialog } from '@/components/admin/buildings/edit-room-dialog';
import { DeleteRoomDialog } from '@/components/admin/buildings/delete-room-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export default async function BuildingsPage({ searchParams }: { searchParams: { email?: string } }) {
  const admin = searchParams.email ? await getAdminByEmail(searchParams.email) : null;
  const buildings = await getBuildings();

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
                        <Link href={`/admin/dashboard?email=${searchParams.email}`}>
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Back to Dashboard</span>
                        </Link>
                      </Button>
                      <div className="grid gap-1">
                        <CardTitle>Manage Buildings</CardTitle>
                        <CardDescription>Add, edit, and remove buildings and rooms.</CardDescription>
                      </div>
                    </div>
                     <CreateBuildingDialog />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {buildings.map((building: Building) => (
                      <Card key={building.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between bg-muted/50 px-6 py-4">
                          <div className="flex items-center gap-4">
                            <Building className="h-6 w-6 text-muted-foreground" />
                            <CardTitle className="text-xl">{building.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1">
                            <EditBuildingDialog building={building} />
                            <DeleteBuildingDialog buildingId={building.id} />
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                           <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-semibold">Rooms</h4>
                              <AddRoomDialog buildingId={building.id} />
                           </div>
                           {building.rooms && building.rooms.length > 0 ? (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Room Name/Number</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {building.rooms.map(room => (
                                    <TableRow key={room.id}>
                                      <TableCell className="font-medium">{room.name}</TableCell>
                                      <TableCell>{room.capacity}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                          <EditRoomDialog buildingId={building.id} room={room} />
                                          <DeleteRoomDialog buildingId={building.id} roomId={room.id} />
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                           ) : (
                              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8">
                                <div className="text-center">
                                  <p className="text-muted-foreground">No rooms found for this building.</p>
                                  <p className="mt-1 text-sm text-muted-foreground">Click 'Add Room' to get started.</p>
                                </div>
                              </div>
                           )}
                        </CardContent>
                      </Card>
                    ))}
                    {buildings.length === 0 && (
                      <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
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
    </div>
  );
}