
'use client';

import * as React from 'react';
import {
  Users,
  Building2,
  Network,
  BookOpen,
  CalendarCheck,
  ClipboardList,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';

import type { Admin } from '@/lib/admin';
import type { Room } from '@/lib/buildings';
import { AiScheduleGenerator } from '@/components/admin/ai-schedule-generator';
import { ManualScheduleCreator } from '@/components/admin/manual-schedule-creator';
import { RoomAvailabilityChecker } from '@/components/admin/room-availability-checker';
import { RoomRequests } from './room-requests';
import type { RoomRequest } from '@/lib/requests';
import type { Department } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import type { Subject } from '@/lib/subjects';
import { getPublishedSchedule } from '@/lib/schedule';
import { GenerateScheduleOutput } from '@/ai/flows/generate-schedule';

interface DashboardClientProps {
    admin: Admin | null;
    allRooms: Room[];
    adminEmail: string;
    roomRequests: RoomRequest[];
    departments: Department[];
    faculty: Faculty[];
    subjects: Subject[];
    publishedSchedule: string;
}

export function DashboardClient({ admin, allRooms, adminEmail, roomRequests, departments, faculty, subjects, publishedSchedule }: DashboardClientProps) {
    const [generatedSchedule, setGeneratedSchedule] = React.useState<GenerateScheduleOutput | null>(null);

    const scheduleToDisplay = generatedSchedule?.schedule || publishedSchedule;
    
    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6">
            <div className="my-8">
                <h1 className="text-3xl font-semibold">Management Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome, {admin?.name}. Manage your institution's resources from here.
                </p>
            </div>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Link href={`/admin/dashboard/faculty?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Faculty</CardTitle>
                          <Users className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Add, edit, and view faculty members.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/buildings?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Buildings</CardTitle>
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Define campus buildings and rooms.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/departments?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Departments</CardTitle>
                          <Network className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Organize academic departments.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/subjects?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Subjects</CardTitle>
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Create and configure subjects/courses.</p>
                      </CardContent>
                  </Card>
              </Link>
              <Link href={`/admin/dashboard/schedule?email=${adminEmail}`}>
                <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-semibold">Published Schedule</CardTitle>
                        <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">View the currently published schedule.</p>
                    </CardContent>
                </Card>
              </Link>
              <Link href={`/admin/dashboard/logs?email=${adminEmail}`}>
                  <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-lg font-semibold">Recent Logs</CardTitle>
                          <ClipboardList className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">View recent faculty login activity.</p>
                      </CardContent>
                  </Card>
              </Link>
          </div>
            <div className="grid gap-6 pt-8">
                <RoomRequests initialRequests={roomRequests} adminEmail={adminEmail} />
                
                <Tabs defaultValue="generator" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generator">AI Schedule Generator</TabsTrigger>
                    <TabsTrigger value="manual">Manual Schedule Creator</TabsTrigger>
                  </TabsList>
                  <TabsContent value="generator" className="mt-6">
                    <AiScheduleGenerator
                        allRooms={allRooms}
                        generatedSchedule={generatedSchedule}
                        setGeneratedSchedule={setGeneratedSchedule}
                        adminEmail={adminEmail}
                        departments={departments}
                        faculty={faculty}
                        subjects={subjects}
                    />
                  </TabsContent>
                  <TabsContent value="manual" className="mt-6">
                    <ManualScheduleCreator
                        allRooms={allRooms}
                        adminEmail={adminEmail}
                        departments={departments}
                        faculty={faculty}
                        subjects={subjects}
                        publishedSchedule={publishedSchedule}
                    />
                  </TabsContent>
                </Tabs>

                <RoomAvailabilityChecker
                    userRole="admin"
                    allRooms={allRooms}
                    schedule={scheduleToDisplay}
                    adminEmail={adminEmail}
                />
            </div>
      </div>
    )
}
