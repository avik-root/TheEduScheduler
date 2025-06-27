
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Users2 } from 'lucide-react';
import { EditSectionDialog } from '@/components/admin/departments/programs/years/sections/edit-section-dialog';
import { DeleteSectionDialog } from '@/components/admin/departments/programs/years/sections/delete-section-dialog';
import { DeleteSelectedSectionsDialog } from '@/components/admin/departments/programs/years/sections/delete-selected-sections-dialog';
import type { Section } from '@/lib/departments';

interface SectionsListProps {
  departmentId: string;
  programId: string;
  yearId: string;
  sections: Section[];
  adminEmail: string;
}

export function SectionsList({ departmentId, programId, yearId, sections, adminEmail }: SectionsListProps) {
  const [selectedSectionIds, setSelectedSectionIds] = React.useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSectionIds(sections.map(section => section.id));
    } else {
      setSelectedSectionIds([]);
    }
  };

  const handleSelectSection = (sectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSectionIds(prev => [...prev, sectionId]);
    } else {
      setSelectedSectionIds(prev => prev.filter(id => id !== sectionId));
    }
  };

  const isAllSelected = sections.length > 0 && selectedSectionIds.length === sections.length;
  const isSomeSelected = selectedSectionIds.length > 0 && selectedSectionIds.length < sections.length;

  return (
    <div>
        <div className="mb-4 flex min-h-[36px] items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="select-all"
                    checked={isAllSelected || (isSomeSelected ? 'indeterminate' : false)}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all sections"
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                    {selectedSectionIds.length > 0 ? `${selectedSectionIds.length} selected` : `Select All`}
                </label>
            </div>
            {selectedSectionIds.length > 0 && (
                <DeleteSelectedSectionsDialog
                    departmentId={departmentId}
                    programId={programId}
                    yearId={yearId}
                    sectionIds={selectedSectionIds}
                    onSuccess={() => setSelectedSectionIds([])}
                    adminEmail={adminEmail}
                />
            )}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section: Section) => (
            <Card key={section.id} className={`h-full flex flex-col relative transition-all ${selectedSectionIds.includes(section.id) ? 'border-primary ring-2 ring-primary' : ''}`}>
                <div className="absolute top-4 left-4 z-10">
                    <Checkbox
                        id={`select-${section.id}`}
                        checked={selectedSectionIds.includes(section.id)}
                        onCheckedChange={(checked) => handleSelectSection(section.id, !!checked)}
                        className="h-5 w-5"
                        aria-label={`Select section ${section.name}`}
                    />
                </div>
                <CardHeader className="flex-grow pl-12">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    {section.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                    <EditSectionDialog departmentId={departmentId} programId={programId} yearId={yearId} section={section} adminEmail={adminEmail} />
                    <DeleteSectionDialog departmentId={departmentId} programId={programId} yearId={yearId} sectionId={section.id} adminEmail={adminEmail} />
                    </div>
                </div>
                </CardHeader>
                <CardContent className="pl-12">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users2 className="h-4 w-4" />
                        <span>Students: {section.studentCount}</span>
                    </div>
                </CardContent>
            </Card>
            ))}
            {sections.length === 0 && (
            <div className="col-span-1 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 sm:col-span-2 lg:col-span-3">
                <div className="text-center">
                    <p className="text-muted-foreground">
                    No sections found for this year.
                    </p>
                    <p className="text-sm text-muted-foreground">
                    Click &apos;Add New Section(s)&apos; to get started.
                    </p>
                </div>
            </div>
            )}
        </div>
    </div>
  );
}
