
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EditFacultyDialog } from '@/components/admin/faculty/edit-faculty-dialog';
import { DeleteFacultyDialog } from '@/components/admin/faculty/delete-faculty-dialog';
import { UserCog, Search, Network } from 'lucide-react';
import type { Faculty } from '@/lib/faculty';
import type { Department } from '@/lib/departments';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteSelectedFacultyDialog } from './delete-selected-faculty-dialog';
import { cn } from '@/lib/utils';

interface FacultyListProps {
    initialFaculty: Faculty[];
    departments: Department[];
    adminEmail: string;
}

export function FacultyList({ initialFaculty, departments, adminEmail }: FacultyListProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedFacultyEmails, setSelectedFacultyEmails] = React.useState<string[]>([]);

    const filteredFaculty = initialFaculty.filter(faculty =>
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (faculty.abbreviation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const facultyByDepartment = departments
        .map(department => ({
            ...department,
            faculty: filteredFaculty.filter(f => f.department === department.name)
        }))
        .filter(department => department.faculty.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));

    const facultyWithoutDepartment = filteredFaculty.filter(f => !departments.some(d => d.name === f.department));

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFacultyEmails(filteredFaculty.map(f => f.email));
        } else {
            setSelectedFacultyEmails([]);
        }
    };

    const handleSelectFaculty = (email: string, checked: boolean) => {
        if (checked) {
            setSelectedFacultyEmails(prev => [...prev, email]);
        } else {
            setSelectedFacultyEmails(prev => prev.filter(id => id !== email));
        }
    };

    const isAllSelected = filteredFaculty.length > 0 && selectedFacultyEmails.length === filteredFaculty.length;
    const isSomeSelected = selectedFacultyEmails.length > 0 && selectedFacultyEmails.length < filteredFaculty.length;


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
            
            <div className="mb-4 flex min-h-[36px] items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="select-all"
                        checked={isAllSelected || (isSomeSelected ? 'indeterminate' : false)}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all faculty"
                        disabled={filteredFaculty.length === 0}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                        {selectedFacultyEmails.length > 0 ? `${selectedFacultyEmails.length} selected` : `Select All`}
                    </label>
                </div>
                {selectedFacultyEmails.length > 0 && (
                    <DeleteSelectedFacultyDialog
                        emails={selectedFacultyEmails}
                        onSuccess={() => setSelectedFacultyEmails([])}
                        adminEmail={adminEmail}
                    />
                )}
            </div>


            {facultyByDepartment.length === 0 && facultyWithoutDepartment.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
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
            ) : (
                <div className="space-y-8">
                    {facultyByDepartment.map(department => (
                        <div key={department.id}>
                            <div className="mb-4 flex items-center gap-3 border-b pb-2">
                                <Network className="h-6 w-6 text-primary" />
                                <h2 className="text-2xl font-semibold text-primary">{department.name}</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {department.faculty.map((faculty: Faculty) => (
                                    <Card key={faculty.email} className={cn("relative transition-all", selectedFacultyEmails.includes(faculty.email) ? 'border-primary ring-2 ring-primary' : '')}>
                                         <div className="absolute top-4 left-4 z-10">
                                            <Checkbox
                                                id={`select-${faculty.email}`}
                                                checked={selectedFacultyEmails.includes(faculty.email)}
                                                onCheckedChange={(checked) => handleSelectFaculty(faculty.email, !!checked)}
                                                className="h-5 w-5"
                                                aria-label={`Select ${faculty.name}`}
                                            />
                                        </div>
                                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4 pl-14">
                                            <div className="flex flex-1 items-start gap-4 min-w-0">
                                                <div className="rounded-full bg-primary/10 p-3">
                                                    <UserCog className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-xl">{faculty.name} {faculty.abbreviation ? `(${faculty.abbreviation})` : ''}</CardTitle>
                                                    <CardDescription>{faculty.email}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <EditFacultyDialog faculty={faculty} departments={departments} adminEmail={adminEmail} />
                                                <DeleteFacultyDialog faculty={faculty} adminEmail={adminEmail} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pl-14">
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
                            </div>
                        </div>
                    ))}
                    {facultyWithoutDepartment.length > 0 && (
                         <div key="unassigned-department">
                            <div className="mb-4 flex items-center gap-3 border-b pb-2">
                                <Network className="h-6 w-6 text-muted-foreground" />
                                <h2 className="text-2xl font-semibold text-muted-foreground">Unassigned Department</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {facultyWithoutDepartment.map((faculty: Faculty) => (
                                   <Card key={faculty.email} className={cn("relative transition-all", selectedFacultyEmails.includes(faculty.email) ? 'border-primary ring-2 ring-primary' : '')}>
                                        <div className="absolute top-4 left-4 z-10">
                                            <Checkbox
                                                id={`select-${faculty.email}`}
                                                checked={selectedFacultyEmails.includes(faculty.email)}
                                                onCheckedChange={(checked) => handleSelectFaculty(faculty.email, !!checked)}
                                                className="h-5 w-5"
                                                aria-label={`Select ${faculty.name}`}
                                            />
                                        </div>
                                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4 pl-14">
                                            <div className="flex flex-1 items-start gap-4 min-w-0">
                                                <div className="rounded-full bg-primary/10 p-3">
                                                    <UserCog className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-xl">{faculty.name} {faculty.abbreviation ? `(${faculty.abbreviation})` : ''}</CardTitle>
                                                    <CardDescription>{faculty.email}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <EditFacultyDialog faculty={faculty} departments={departments} adminEmail={adminEmail} />
                                                <DeleteFacultyDialog faculty={faculty} adminEmail={adminEmail} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pl-14">
                                            <p className="text-sm text-muted-foreground">
                                                Department: <span className="font-medium text-foreground">{faculty.department || 'N/A'}</span>
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
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
