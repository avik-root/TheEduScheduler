'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import bcrypt from 'bcrypt';
import { FacultySchema, UpdateFacultySchema, LoginSchema } from '@/lib/validators/auth';

const facultyFilePath = path.join(process.cwd(), 'src', 'data', 'faculty.json');

export type Faculty = z.infer<typeof FacultySchema>;
type UpdateFacultyData = z.infer<typeof UpdateFacultySchema>;
type LoginData = z.infer<typeof LoginSchema>;


async function readFacultyFile(): Promise<Faculty[]> {
    try {
        await fs.access(facultyFilePath);
        const fileContent = await fs.readFile(facultyFilePath, 'utf-8');
        if (!fileContent.trim()) {
            return [];
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

async function writeFacultyFile(faculty: Faculty[]): Promise<void> {
    await fs.mkdir(path.dirname(facultyFilePath), { recursive: true });
    await fs.writeFile(facultyFilePath, JSON.stringify(faculty, null, 2));
}

export async function getFaculty(): Promise<Faculty[]> {
    return await readFacultyFile();
}

export async function getFacultyByEmail(email: string): Promise<Faculty | null> {
    const facultyList = await readFacultyFile();
    const faculty = facultyList.find(f => f.email === email);
    return faculty || null;
}

export async function createFaculty(data: Faculty): Promise<{ success: boolean; message: string }> {
    const facultyList = await readFacultyFile();

    const existingFaculty = facultyList.find(f => f.email === data.email);
    if (existingFaculty) {
        return { success: false, message: 'A faculty member with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newFaculty = { ...data, password: hashedPassword };

    facultyList.push(newFaculty);

    try {
        await writeFacultyFile(facultyList);
        return { success: true, message: 'Faculty account created successfully.' };
    } catch (error) {
        console.error('Failed to create faculty:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function updateFaculty(data: UpdateFacultyData): Promise<{ success: boolean; message: string }> {
    const facultyList = await readFacultyFile();

    const facultyIndex = facultyList.findIndex(f => f.email === data.email);
    if (facultyIndex === -1) {
        return { success: false, message: 'Faculty member not found.' };
    }
    
    const facultyToUpdate = facultyList[facultyIndex];
    facultyToUpdate.name = data.name;
    facultyToUpdate.department = data.department;
    facultyToUpdate.weeklyMaxHours = data.weeklyMaxHours;
    facultyToUpdate.weeklyOffDays = data.weeklyOffDays || [];


    if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        facultyToUpdate.password = hashedPassword;
    }
    
    facultyList[facultyIndex] = facultyToUpdate;

    try {
        await writeFacultyFile(facultyList);
        return { success: true, message: 'Faculty account updated successfully.' };
    } catch (error) {
        console.error('Failed to update faculty:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function deleteFaculty(email: string): Promise<{ success: boolean; message: string }> {
    let facultyList = await readFacultyFile();
    const updatedFacultyList = facultyList.filter(f => f.email !== email);

    if (facultyList.length === updatedFacultyList.length) {
         return { success: false, message: 'Faculty member not found.' };
    }

    try {
        await writeFacultyFile(updatedFacultyList);
        return { success: true, message: 'Faculty account deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete faculty:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function loginFaculty(credentials: LoginData): Promise<{ success: boolean; message: string }> {
    const facultyList = await readFacultyFile();

    if (facultyList.length === 0) {
        return { success: false, message: 'No faculty accounts exist.' };
    }

    const faculty = facultyList.find(f => f.email === credentials.email);

    if (!faculty) {
        return { success: false, message: 'Invalid email or password.' };
    }

    const passwordMatch = await bcrypt.compare(credentials.password, faculty.password);

    if (passwordMatch) {
        return { success: true, message: 'Login successful!' };
    }

    return { success: false, message: 'Invalid email or password.' };
}
