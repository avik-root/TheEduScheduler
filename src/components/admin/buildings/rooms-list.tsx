'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DoorOpen, Users } from 'lucide-react';
import { EditRoomDialog } from '@/components/admin/buildings/edit-room-dialog';
import { DeleteRoomDialog } from '@/components/admin/buildings/delete-room-dialog';
import { DeleteSelectedRoomsDialog } from '@/components/admin/buildings/delete-selected-rooms-dialog';
import type { Room } from '@/lib/buildings';

interface RoomsListProps {
  buildingId: string;
  floorId: string;
  rooms: Room[];
}

export function RoomsList({ buildingId, floorId, rooms }: RoomsListProps) {
  const [selectedRoomIds, setSelectedRoomIds] = React.useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRoomIds(rooms.map(room => room.id));
    } else {
      setSelectedRoomIds([]);
    }
  };

  const handleSelectRoom = (roomId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoomIds(prev => [...prev, roomId]);
    } else {
      setSelectedRoomIds(prev => prev.filter(id => id !== roomId));
    }
  };

  const isAllSelected = rooms.length > 0 && selectedRoomIds.length === rooms.length;
  const isSomeSelected = selectedRoomIds.length > 0 && selectedRoomIds.length < rooms.length;

  return (
    <div>
        <div className="mb-4 flex min-h-[36px] items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="select-all"
                    checked={isAllSelected || (isSomeSelected ? 'indeterminate' : false)}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all rooms"
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                    {selectedRoomIds.length > 0 ? `${selectedRoomIds.length} selected` : `Select All`}
                </label>
            </div>
            {selectedRoomIds.length > 0 && (
                <DeleteSelectedRoomsDialog
                    buildingId={buildingId}
                    floorId={floorId}
                    roomIds={selectedRoomIds}
                    onSuccess={() => setSelectedRoomIds([])}
                />
            )}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room: Room) => (
            <Card key={room.id} className={`h-full flex flex-col relative transition-all ${selectedRoomIds.includes(room.id) ? 'border-primary ring-2 ring-primary' : ''}`}>
                <div className="absolute top-4 left-4 z-10">
                    <Checkbox
                        id={`select-${room.id}`}
                        checked={selectedRoomIds.includes(room.id)}
                        onCheckedChange={(checked) => handleSelectRoom(room.id, !!checked)}
                        className="h-5 w-5"
                        aria-label={`Select room ${room.name}`}
                    />
                </div>
                <CardHeader className="flex-grow pl-12">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                    <DoorOpen className="h-5 w-5 text-muted-foreground" />
                    {room.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                    <EditRoomDialog buildingId={buildingId} floorId={floorId} room={room} />
                    <DeleteRoomDialog buildingId={buildingId} floorId={floorId} roomId={room.id} />
                    </div>
                </div>
                </CardHeader>
                <CardContent className="pl-12">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Capacity: {room.capacity}</span>
                    </div>
                </CardContent>
            </Card>
            ))}
            {rooms.length === 0 && (
            <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                <div className="text-center">
                    <p className="text-muted-foreground">
                    No rooms found for this floor.
                    </p>
                    <p className="text-sm text-muted-foreground">
                    Click &apos;Add New Room(s)&apos; to get started.
                    </p>
                </div>
            </div>
            )}
        </div>
    </div>
  );
}
