'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EditSubjectDialog } from '@/components/admin/subjects/edit-subject-dialog';
import { DeleteSubjectDialog } from '@/components/admin/subjects/delete-subject-dialog';
import { BookOpen, User, Network, BookCopy, Calendar as CalendarIcon, Search, Star } from 'lucide-react';
import type { Subject } from '@/lib/subjects';
import type { Department, Program, Year } from '@/lib/departments';
import type { Faculty } from '@/lib/faculty';
import { Separator } from '@/components/ui/separator';

interface SubjectsListProps {
    initialSubjects: Subject[];
    departments: Department[];
    faculty: Faculty[];
    adminEmail: string;
}

interface StructuredDepartment extends Omit<Department, 'programs'> {
    programs: (Omit<Program, 'years'> & {
        years: (Omit<Year, 'sections'> & {
            subjects: Subject[];
        })[];
    })[];
}


export function SubjectsList({ initialSubjects, departments, faculty, adminEmail }: SubjectsListProps) {
    const [searchQuery, setSearchQuery] = React.useState('');

    const getSubjectDetails = React.useCallback((subject: Subject) => {
        const department = departments.find(d => d.id === subject.departmentId);
        if (!department) return { departmentName: 'N/A', programName: 'N/A', yearName: 'N/A', facultyNames: 'N/A' };

        const program = (department.programs || []).find(p => p.id === subject.programId);
        const year = (program?.years || []).find(y => y.id === subject.yearId);
        const facultyMembers = faculty.filter(f => subject.facultyEmails && subject.facultyEmails.includes(f.email));

        return {
            departmentName: department.name,
            programName: program?.name || 'N/A',
            yearName: year?.name || 'N/A',
            facultyNames: facultyMembers.map(f => f.name).join(', ') || 'N/A'
        };
    }, [departments, faculty]);


    const groupedAndFilteredSubjects: StructuredDepartment[] = React.useMemo(() => {
        const query = searchQuery.toLowerCase();
        const filteredSubjects = initialSubjects.filter(subject => {
            const details = getSubjectDetails(subject);
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

        const subjectsByYear = new Map<string, Subject[]>();
        filteredSubjects.forEach(subject => {
            if (!subjectsByYear.has(subject.yearId)) {
                subjectsByYear.set(subject.yearId, []);
            }
            subjectsByYear.get(subject.yearId)!.push(subject);
        });

        return departments.map(department => ({
            ...department,
            programs: (department.programs || []).map(program => ({
                ...program,
                years: (program.years || []).map(year => ({
                    ...year,
                    subjects: subjectsByYear.get(year.id) || []
                })).filter(year => year.subjects.length > 0)
            })).filter(program => program.years.length > 0)
        })).filter(department => department.programs.length > 0);

    }, [searchQuery, initialSubjects, departments, getSubjectDetails]);

    return (
        <div>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search subjects by name, code, type, department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            {groupedAndFilteredSubjects.length === 0 ? (
                 <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                    <div className="text-center">
                        <p className="text-muted-foreground">
                            {initialSubjects.length > 0 ? 'No subjects found matching your search.' : 'No subjects found.'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {initialSubjects.length > 0 ? 'Try a different search query.' : "Click 'Create New Subject' to get started."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {groupedAndFilteredSubjects.map((department) => (
                        <div key={department.id}>
                            <div className="flex items-center gap-3">
                                <Network className="h-7 w-7 text-primary" />
                                <h2 className="text-3xl font-bold tracking-tight text-primary">{department.name}</h2>
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-6 pl-4 border-l-2 border-primary/20">
                                {department.programs.map((program) => (
                                    <div key={program.id}>
                                        <div className="flex items-center gap-3">
                                            <BookCopy className="h-6 w-6 text-foreground/80" />
                                            <h3 className="text-2xl font-semibold text-foreground/90">{program.name}</h3>
                                        </div>
                                        <div className="space-y-4 mt-3 pl-6 border-l-2 border-foreground/20">
                                            {program.years.map((year) => (
                                                <div key={year.id}>
                                                    <div className="flex items-center gap-3">
                                                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                                                        <h4 className="text-xl font-medium text-muted-foreground">{year.name}</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-3 pl-8">
                                                        {year.subjects.map((subject) => {
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
                                                                            <div className="flex items-start gap-2">
                                                                                <User className="h-4 w-4 shrink-0 mt-0.5" />
                                                                                <span>{details.facultyNames}</span>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}