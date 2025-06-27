'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { DepartmentSchema } from '@/lib/validators/auth';

const departmentsFilePath = path.join(process.cwd(), 'src', 'data', 'departments.json');

export interface Department {
    id: string;
    name: string;
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
    return await readDepartmentsFile();
}

export async function createDepartment(data: DepartmentData): Promise<{ success: boolean; message: string }> {
    const departments = await readDepartmentsFile();
    const newDepartment: Department = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: data.name,
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
    const departments = await readDepartmentsFile();
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
    const departments = await readDepartmentsFile();
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
