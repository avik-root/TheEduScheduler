
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { DepartmentSchema } from '@/lib/validators/auth';
import { getAdminDataPath } from './common';

export interface Section {
    id: string;
    name: string;
    studentCount: number;
}

export interface Year {
    id: string;
    name: string;
    sections: Section[];
}

export interface Program {
    id: string;
    name: string;
    years: Year[];
}

export interface Department {
    id: string;
    name: string;
    programs: Program[];
}

type DepartmentData = z.infer<typeof DepartmentSchema>;

async function getDepartmentsFilePath(adminEmail: string): Promise<string> {
    const adminDataPath = getAdminDataPath(adminEmail);
    await fs.mkdir(adminDataPath, { recursive: true });
    return path.join(adminDataPath, 'departments.json');
}

async function readDepartmentsFile(adminEmail: string): Promise<Department[]> {
    try {
        const filePath = await getDepartmentsFilePath(adminEmail);
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        if (!fileContent.trim()) {
            return [];
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

async function writeDepartmentsFile(adminEmail: string, departments: Department[]): Promise<void> {
    const filePath = await getDepartmentsFilePath(adminEmail);
    await fs.writeFile(filePath, JSON.stringify(departments, null, 2));
}

function ensureHierarchy(departments: Department[]): Department[] {
    return departments.map(d => ({
        ...d,
        programs: (d.programs || []).map(p => ({
            ...p,
            years: (p.years || []).map(y => ({
                ...y,
                sections: y.sections || []
            }))
        }))
    }));
}

export async function getDepartments(adminEmail: string): Promise<Department[]> {
    if (!adminEmail) return [];
    const departments = await readDepartmentsFile(adminEmail);
    return ensureHierarchy(departments);
}

export async function getDepartmentById(adminEmail: string, id: string): Promise<Department | null> {
    if (!adminEmail) return null;
    const departments = await getDepartments(adminEmail);
    const department = departments.find(d => d.id === id);
    return department || null;
}

export async function createDepartment(adminEmail: string, data: DepartmentData): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const newDepartment: Department = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: data.name,
        programs: []
    };
    departments.push(newDepartment);
    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Department created successfully.' };
    } catch (error) {
        console.error('Failed to create department:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateDepartment(adminEmail: string, id: string, data: DepartmentData): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const departmentIndex = departments.findIndex(d => d.id === id);
    if (departmentIndex === -1) {
        return { success: false, message: 'Department not found.' };
    }
    departments[departmentIndex].name = data.name;
    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Department updated successfully.' };
    } catch (error) {
        console.error('Failed to update department:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteDepartment(adminEmail: string, id: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const updatedDepartments = departments.filter(d => d.id !== id);
    if (departments.length === updatedDepartments.length) {
        return { success: false, message: 'Department not found.' };
    }
    try {
        await writeDepartmentsFile(adminEmail, updatedDepartments);
        return { success: true, message: 'Department deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete department:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

// Program Functions
export async function getProgramById(adminEmail: string, departmentId: string, programId: string): Promise<Program | null> {
    const department = await getDepartmentById(adminEmail, departmentId);
    return department?.programs.find(p => p.id === programId) || null;
}

export async function addProgram(adminEmail: string, departmentId: string, programName: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const departmentIndex = departments.findIndex(d => d.id === departmentId);
    if (departmentIndex === -1) {
        return { success: false, message: 'Department not found.' };
    }
    const newProgram: Program = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: programName,
        years: [],
    };
    departments[departmentIndex].programs.push(newProgram);
    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Program created successfully.' };
    } catch (error) {
        console.error('Failed to add program:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateProgram(adminEmail: string, departmentId: string, programId: string, programName: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const departmentIndex = departments.findIndex(d => d.id === departmentId);
    if (departmentIndex === -1) return { success: false, message: 'Department not found.' };
    const programIndex = departments[departmentIndex].programs.findIndex(p => p.id === programId);
    if (programIndex === -1) return { success: false, message: 'Program not found.' };
    
    departments[departmentIndex].programs[programIndex].name = programName;
    
    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Program updated successfully.' };
    } catch (error) {
        console.error('Failed to update program:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteProgram(adminEmail: string, departmentId: string, programId: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const departmentIndex = departments.findIndex(d => d.id === departmentId);
    if (departmentIndex === -1) return { success: false, message: 'Department not found.' };
    
    const originalCount = departments[departmentIndex].programs.length;
    departments[departmentIndex].programs = departments[departmentIndex].programs.filter(p => p.id !== programId);
    
    if (departments[departmentIndex].programs.length === originalCount) return { success: false, message: 'Program not found.' };
    
    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Program deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete program:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

// Year Functions
export async function addYears(adminEmail: string, departmentId: string, programId: string, names: string[]): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const deptIdx = departments.findIndex(d => d.id === departmentId);
    if (deptIdx === -1) return { success: false, message: 'Department not found.' };
    const progIdx = departments[deptIdx].programs.findIndex(p => p.id === programId);
    if (progIdx === -1) return { success: false, message: 'Program not found.' };

    names.forEach(name => {
        const newYear: Year = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name,
            sections: [],
        };
        departments[deptIdx].programs[progIdx].years.push(newYear);
    });

    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: `${names.length} year(s) added successfully.` };
    } catch (e) {
        return { success: false, message: 'Failed to add years.' };
    }
}

export async function updateYear(adminEmail: string, departmentId: string, programId: string, yearId: string, name: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const deptIdx = departments.findIndex(d => d.id === departmentId);
    if (deptIdx === -1) return { success: false, message: 'Department not found.' };
    const progIdx = departments[deptIdx].programs.findIndex(p => p.id === programId);
    if (progIdx === -1) return { success: false, message: 'Program not found.' };
    const yearIdx = departments[deptIdx].programs[progIdx].years.findIndex(y => y.id === yearId);
    if (yearIdx === -1) return { success: false, message: 'Year not found.' };

    departments[deptIdx].programs[progIdx].years[yearIdx].name = name;

    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Year updated successfully.' };
    } catch (e) {
        return { success: false, message: 'Failed to update year.' };
    }
}

export async function deleteYear(adminEmail: string, departmentId: string, programId: string, yearId: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const deptIdx = departments.findIndex(d => d.id === departmentId);
    if (deptIdx === -1) return { success: false, message: 'Department not found.' };
    const progIdx = departments[deptIdx].programs.findIndex(p => p.id === programId);
    if (progIdx === -1) return { success: false, message: 'Program not found.' };
    
    departments[deptIdx].programs[progIdx].years = departments[deptIdx].programs[progIdx].years.filter(y => y.id !== yearId);

    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Year deleted successfully.' };
    } catch (e) {
        return { success: false, message: 'Failed to delete year.' };
    }
}


// Section Functions
export async function addSections(adminEmail: string, departmentId: string, programId: string, yearId: string, sections: Omit<Section, 'id'>[]): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const deptIdx = departments.findIndex(d => d.id === departmentId);
    if (deptIdx === -1) return { success: false, message: 'Department not found.' };
    const progIdx = departments[deptIdx].programs.findIndex(p => p.id === programId);
    if (progIdx === -1) return { success: false, message: 'Program not found.' };
    const yearIdx = departments[deptIdx].programs[progIdx].years.findIndex(y => y.id === yearId);
    if (yearIdx === -1) return { success: false, message: 'Year not found.' };

    sections.forEach(sectionData => {
        const newSection: Section = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...sectionData,
        };
        departments[deptIdx].programs[progIdx].years[yearIdx].sections.push(newSection);
    });

    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: `${sections.length} section(s) added successfully.` };
    } catch (e) {
        return { success: false, message: 'Failed to add sections.' };
    }
}

export async function updateSection(adminEmail: string, departmentId: string, programId: string, yearId: string, sectionId: string, data: Omit<Section, 'id'>): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const deptIdx = departments.findIndex(d => d.id === departmentId);
    if (deptIdx === -1) return { success: false, message: 'Department not found.' };
    const progIdx = departments[deptIdx].programs.findIndex(p => p.id === programId);
    if (progIdx === -1) return { success: false, message: 'Program not found.' };
    const yearIdx = departments[deptIdx].programs[progIdx].years.findIndex(y => y.id === yearId);
    if (yearIdx === -1) return { success: false, message: 'Year not found.' };
    const sectionIdx = departments[deptIdx].programs[progIdx].years[yearIdx].sections.findIndex(s => s.id === sectionId);
    if (sectionIdx === -1) return { success: false, message: 'Section not found.' };

    departments[deptIdx].programs[progIdx].years[yearIdx].sections[sectionIdx] = { ...departments[deptIdx].programs[progIdx].years[yearIdx].sections[sectionIdx], ...data };

    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Section updated successfully.' };
    } catch (e) {
        return { success: false, message: 'Failed to update section.' };
    }
}

export async function deleteSection(adminEmail: string, departmentId: string, programId: string, yearId: string, sectionId: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const deptIdx = departments.findIndex(d => d.id === departmentId);
    if (deptIdx === -1) return { success: false, message: 'Department not found.' };
    const progIdx = departments[deptIdx].programs.findIndex(p => p.id === programId);
    if (progIdx === -1) return { success: false, message: 'Program not found.' };
    const yearIdx = departments[deptIdx].programs[progIdx].years.findIndex(y => y.id === yearId);
    if (yearIdx === -1) return { success: false, message: 'Year not found.' };
    
    departments[deptIdx].programs[progIdx].years[yearIdx].sections = departments[deptIdx].programs[progIdx].years[yearIdx].sections.filter(s => s.id !== sectionId);

    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: 'Section deleted successfully.' };
    } catch (e) {
        return { success: false, message: 'Failed to delete section.' };
    }
}

export async function deleteSections(adminEmail: string, departmentId: string, programId: string, yearId: string, sectionIds: string[]): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments(adminEmail);
    const deptIdx = departments.findIndex(d => d.id === departmentId);
    if (deptIdx === -1) return { success: false, message: 'Department not found.' };
    const progIdx = departments[deptIdx].programs.findIndex(p => p.id === programId);
    if (progIdx === -1) return { success: false, message: 'Program not found.' };
    const yearIdx = departments[deptIdx].programs[progIdx].years.findIndex(y => y.id === yearId);
    if (yearIdx === -1) return { success: false, message: 'Year not found.' };
    
    const originalCount = departments[deptIdx].programs[progIdx].years[yearIdx].sections.length;
    departments[deptIdx].programs[progIdx].years[yearIdx].sections = departments[deptIdx].programs[progIdx].years[yearIdx].sections.filter(s => !sectionIds.includes(s.id));
    const deletedCount = originalCount - departments[deptIdx].programs[progIdx].years[yearIdx].sections.length;

    if (deletedCount === 0) return { success: false, message: 'No matching sections found.' };

    try {
        await writeDepartmentsFile(adminEmail, departments);
        return { success: true, message: `${deletedCount} section(s) deleted successfully.` };
    } catch (e) {
        return { success: false, message: 'Failed to delete sections.' };
    }
}
