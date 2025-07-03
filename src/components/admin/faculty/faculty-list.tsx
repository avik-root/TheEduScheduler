
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EditFacultyDialog } from '@/components/admin/faculty/edit-faculty-dialog';
import { DeleteFacultyDialog } from '@/components/admin/faculty/delete-faculty-dialog';
import { UserCog, Search } from 'lucide-react';
import type { Faculty } from '@/lib/faculty';
import type { Department } from '@/lib/departments';

interface FacultyListProps {
    initialFaculty: Faculty[];
    departments: Department[];
    adminEmail: string;
}

export function FacultyList({ initialFaculty, departments, adminEmail }: FacultyListProps) {
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredFaculty = initialFaculty.filter(faculty =>
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search faculty by name, email, abbreviation, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFaculty.map((faculty: Faculty) => (
                  <Card key={faculty.email}>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          <UserCog className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{faculty.name} ({faculty.abbreviation})</CardTitle>
                          <CardDescription>{faculty.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <EditFacultyDialog faculty={faculty} departments={departments} adminEmail={adminEmail} />
                        <DeleteFacultyDialog faculty={faculty} adminEmail={adminEmail} />
                      </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Department: <span className="font-medium text-foreground">{faculty.department}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Weekly Max Hours: <span className="font-medium text-foreground">{faculty.weeklyMaxHours}</span>
                        </p>
                        {faculty.weeklyOffDays && faculty.weeklyOffDays.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                              Weekly Off: <span className="font-medium text-foreground">{faculty.weeklyOffDays.join(', ')}</span>
                          </p>
                        )}
                    </CardContent>
                  </Card>
                ))}
                {filteredFaculty.length === 0 && (
                  <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        No faculty members found.
                      </p>
                       {searchQuery ? (
                         <p className="text-sm text-muted-foreground">
                            Try adjusting your search query.
                         </p>
                       ) : (
                           <p className="text-sm text-muted-foreground">
                            Click &apos;Create New Faculty&apos; to get started.
                          </p>
                       )}
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
}
