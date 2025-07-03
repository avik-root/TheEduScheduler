'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Network,
  BookOpen,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { Admin } from '@/lib/admin';
import type { Room } from '@/lib/buildings';
import type { GenerateScheduleOutput } from '@/ai/flows/generate-schedule';
import { AiScheduleGenerator } from '@/components/admin/ai-schedule-generator';
import { RoomAvailabilityChecker } from '@/components/admin/room-availability-checker';
import { RoomRequests } from './room-requests';
import type { RoomRequest } from '@/lib/requests';

interface DashboardClientProps {
    admin: Admin | null;
    allRooms: Room[];
    adminEmail: string;
    roomRequests: RoomRequest[];
}

export function DashboardClient({ admin, allRooms, adminEmail, roomRequests }: DashboardClientProps) {
    const [generatedSchedule, setGeneratedSchedule] = React.useState<GenerateScheduleOutput | null>(null);

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6">
            <div className="my-8">
                <h1 className="text-3xl font-semibold">Management Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome, {admin?.name}. Manage your institution's resources from here.
                </p>
            </div>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link href={`/admin/dashboard/faculty?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-medium">Faculty</CardTitle>
                          <Users className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground">Add, edit, and view faculty members.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/buildings?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-medium">Buildings</CardTitle>
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground">Define campus buildings and rooms.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/departments?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-medium">Departments</CardTitle>
                          <Network className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground">Organize academic departments.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/subjects?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-medium">Subjects</CardTitle>
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground">Create and configure subjects/courses.</p>
                      </CardContent>
                  </Card>
              </Link>
          </div>
            <div className="grid gap-6 pt-8">
                <RoomRequests initialRequests={roomRequests} adminEmail={adminEmail} />
                <AiScheduleGenerator
                    allRooms={allRooms}
                    generatedSchedule={generatedSchedule}
                    setGeneratedSchedule={setGeneratedSchedule}
                    adminEmail={adminEmail}
                />
                <RoomAvailabilityChecker
                    userRole="admin"
                    allRooms={allRooms}
                    schedule={generatedSchedule?.schedule || ''}
                    adminEmail={adminEmail}
                />
            </div>
      </div>
    )
}
