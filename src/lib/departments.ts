
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { DepartmentSchema } from '@/lib/validators/auth';

const departmentsFilePath = path.join(process.cwd(), 'src', 'data', 'departments.json');

export interface Program {
    id: string;
    name: string;
}

export interface Department {
    id: string;
    name: string;
    programs: Program[];
}

type DepartmentData = z.infer<typeof DepartmentSchema>;

async function readDepartmentsFile(): Promise<Department[]> {
    try {
        await fs.access(departmentsFilePath);
        const fileContent = await fs.readFile(departmentsFilePath, 'utf-8');
        if (!fileContent.trim()) {
            return [];
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

async function writeDepartmentsFile(departments: Department[]): Promise<void> {
    await fs.mkdir(path.dirname(departmentsFilePath), { recursive: true });
    await fs.writeFile(departmentsFilePath, JSON.stringify(departments, null, 2));
}

export async function getDepartments(): Promise<Department[]> {
    const departments = await readDepartmentsFile();
    // Ensure every department has a programs array
    return departments.map(d => ({ ...d, programs: d.programs || [] }));
}

export async function getDepartmentById(id: string): Promise<Department | null> {
    const departments = await getDepartments();
    const department = departments.find(d => d.id === id);
    return department || null;
}

export async function createDepartment(data: DepartmentData): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments();
    const newDepartment: Department = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: data.name,
        programs: []
    };
    departments.push(newDepartment);
    try {
        await writeDepartmentsFile(departments);
        return { success: true, message: 'Department created successfully.' };
    } catch (error) {
        console.error('Failed to create department:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateDepartment(id: string, data: DepartmentData): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments();
    const departmentIndex = departments.findIndex(d => d.id === id);
    if (departmentIndex === -1) {
        return { success: false, message: 'Department not found.' };
    }
    departments[departmentIndex].name = data.name;
    try {
        await writeDepartmentsFile(departments);
        return { success: true, message: 'Department updated successfully.' };
    } catch (error) {
        console.error('Failed to update department:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteDepartment(id: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments();
    const updatedDepartments = departments.filter(d => d.id !== id);
    if (departments.length === updatedDepartments.length) {
        return { success: false, message: 'Department not found.' };
    }
    try {
        await writeDepartmentsFile(updatedDepartments);
        return { success: true, message: 'Department deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete department:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

// Program Functions
export async function addProgram(departmentId: string, programName: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments();
    const departmentIndex = departments.findIndex(d => d.id === departmentId);
    if (departmentIndex === -1) {
        return { success: false, message: 'Department not found.' };
    }
    const newProgram: Program = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: programName,
    };
    departments[departmentIndex].programs.push(newProgram);
    try {
        await writeDepartmentsFile(departments);
        return { success: true, message: 'Program created successfully.' };
    } catch (error) {
        console.error('Failed to add program:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function updateProgram(departmentId: string, programId: string, programName: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments();
    const departmentIndex = departments.findIndex(d => d.id === departmentId);
    if (departmentIndex === -1) {
        return { success: false, message: 'Department not found.' };
    }
    const programIndex = departments[departmentIndex].programs.findIndex(p => p.id === programId);
    if (programIndex === -1) {
        return { success: false, message: 'Program not found.' };
    }
    departments[departmentIndex].programs[programIndex].name = programName;
    try {
        await writeDepartmentsFile(departments);
        return { success: true, message: 'Program updated successfully.' };
    } catch (error) {
        console.error('Failed to update program:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function deleteProgram(departmentId: string, programId: string): Promise<{ success: boolean; message: string }> {
    const departments = await getDepartments();
    const departmentIndex = departments.findIndex(d => d.id === departmentId);
    if (departmentIndex === -1) {
        return { success: false, message: 'Department not found.' };
    }
    const originalCount = departments[departmentIndex].programs.length;
    departments[departmentIndex].programs = departments[departmentIndex].programs.filter(p => p.id !== programId);
    if (departments[departmentIndex].programs.length === originalCount) {
        return { success: false, message: 'Program not found.' };
    }
    try {
        await writeDepartmentsFile(departments);
        return { success: true, message: 'Program deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete program:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
