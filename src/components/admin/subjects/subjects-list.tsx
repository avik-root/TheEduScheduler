
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EditSubjectDialog } from '@/components/admin/subjects/edit-subject-dialog';
import { DeleteSubjectDialog } from '@/components/admin/subjects/delete-subject-dialog';
import { BookOpen, User, Network, BookCopy, Calendar as CalendarIcon, Search, Star } from 'lucide-react';
import type { Subject } from '@/lib/subjects';
import type { Department } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';

interface SubjectsListProps {
    initialSubjects: Subject[];
    departments: Department[];
    faculty: Faculty[];
    adminEmail: string;
}

export function SubjectsList({ initialSubjects, departments, faculty, adminEmail }: SubjectsListProps) {
    const [searchQuery, setSearchQuery] = React.useState('');

    const getSubjectDetails = (subject: Subject) => {
        const department = departments.find(d => d.id === subject.departmentId);
        if (!department) return { departmentName: 'N/A', programName: 'N/A', yearName: 'N/A', facultyNames: 'N/A' };

        const program = department.programs.find(p => p.id === subject.programId);
        const year = program?.years.find(y => y.id === subject.yearId);
        const facultyMembers = faculty.filter(f => subject.facultyEmails && subject.facultyEmails.includes(f.email));

        return {
            departmentName: department.name,
            programName: program?.name || 'N/A',
            yearName: year?.name || 'N/A',
            facultyNames: facultyMembers.map(f => f.name).join(', ') || 'N/A'
        };
    };

    const filteredSubjects = initialSubjects.filter(subject => {
        const details = getSubjectDetails(subject);
        const query = searchQuery.toLowerCase();
        return (
            subject.name.toLowerCase().includes(query) ||
            subject.code.toLowerCase().includes(query) ||
            subject.type.toLowerCase().includes(query) ||
            details.departmentName.toLowerCase().includes(query) ||
            details.programName.toLowerCase().includes(query) ||
            details.yearName.toLowerCase().includes(query) ||
            details.facultyNames.toLowerCase().includes(query)
        );
    });

    return (
        <div>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search subjects by name, code, type, etc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSubjects.map((subject: Subject) => {
                  const details = getSubjectDetails(subject);
                  return (
                   <Card key={subject.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                            <div className="flex-grow">
                                <CardTitle className="text-xl">{subject.name}</CardTitle>
                                <CardDescription>{subject.code}</CardDescription>
                            </div>
                            <div className="flex items-center gap-1">
                                <EditSubjectDialog subject={subject} adminEmail={adminEmail} departments={departments} faculty={faculty} />
                                <DeleteSubjectDialog subject={subject} adminEmail={adminEmail} />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3">
                             <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={subject.type === 'Theory' || subject.type === 'Theory+Lab' ? 'default' : subject.type === 'Lab' ? 'secondary' : 'outline'}>
                                    {subject.type}
                                </Badge>
                                {(subject.theoryCredits) && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Star className="h-3 w-3" /> T: {subject.theoryCredits}
                                    </Badge>
                                )}
                                {(subject.labCredits) && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Star className="h-3 w-3" /> L: {subject.labCredits}
                                    </Badge>
                                )}
                            </div>
                            <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Network className="h-4 w-4 shrink-0" />
                                <span>{details.departmentName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BookCopy className="h-4 w-4 shrink-0" />
                                <span>{details.programName}</span>
                              </div>
                               <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 shrink-0" />
                                <span>{details.yearName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 shrink-0" />
                                <span className="truncate">{details.facultyNames}</span>
                              </div>
                            </div>
                        </CardContent>
                   </Card>
                  )
                })}
                {filteredSubjects.length === 0 && (
                    <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                        <div className="text-center">
                            <p className="text-muted-foreground">
                                No subjects found.
                            </p>
                            {searchQuery ? (
                                <p className="text-sm text-muted-foreground">
                                    Try adjusting your search query.
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Click 'Create New Subject' to get started.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
