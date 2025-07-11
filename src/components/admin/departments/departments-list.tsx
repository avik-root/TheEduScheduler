
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Network, Search } from 'lucide-react';
import type { Department } from '@/lib/departments';

interface DepartmentsListProps {
    initialDepartments: Department[];
    adminEmail: string;
    loggedInAdminEmail: string;
}

export function DepartmentsList({ initialDepartments, adminEmail, loggedInAdminEmail }: DepartmentsListProps) {
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredDepartments = initialDepartments.filter(department =>
        department.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search departments by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDepartments.map((department: Department) => (
                   <Link key={department.id} href={`/admin/dashboard/departments/${department.id}?email=${loggedInAdminEmail}`}>
                        <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                            <CardHeader className="flex-row items-center gap-4">
                                <div className="rounded-full bg-primary/10 p-3">
                                    <Network className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-xl">{department.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">
                                    {department.programs.length} program(s)
                                </p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">Click to manage programs</p>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
                {filteredDepartments.length === 0 && (
                    <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                        <div className="text-center">
                        <p className="text-muted-foreground">
                            {initialDepartments.length > 0 ? 'No departments found matching your search.' : 'No departments found.'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                             {initialDepartments.length > 0 ? 'Try a different search query.' : "Click 'Create New Department' to get started."}
                        </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
