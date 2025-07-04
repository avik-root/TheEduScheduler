
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import bcrypt from 'bcrypt';
import { FacultySchema, UpdateFacultySchema, LoginSchema, FacultyChangePasswordSchema } from '@/lib/validators/auth';
import { getAdminDataPath } from './common';
import { getAdminEmails } from './admin';
import { addFacultyLog } from './logs';
import { headers } from 'next/headers';

const facultyFileName = 'faculty.json';

export type Faculty = z.infer<typeof FacultySchema>;
type UpdateFacultyData = z.infer<typeof UpdateFacultySchema>;
type LoginData = z.infer<typeof LoginSchema>;
type ChangePasswordData = z.infer<typeof FacultyChangePasswordSchema>;


async function getFacultyFilePath(adminEmail: string): Promise<string> {
    const adminDataPath = await getAdminDataPath(adminEmail);
    await fs.mkdir(adminDataPath, { recursive: true });
    return path.join(adminDataPath, facultyFileName);
}

async function readFacultyFile(adminEmail: string): Promise<Faculty[]> {
    try {
        const filePath = await getFacultyFilePath(adminEmail);
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

async function writeFacultyFile(adminEmail: string, faculty: Faculty[]): Promise<void> {
    const filePath = await getFacultyFilePath(adminEmail);
    await fs.writeFile(filePath, JSON.stringify(faculty, null, 2));
}

export async function getFaculty(adminEmail: string): Promise<Faculty[]> {
    if (!adminEmail) return [];
    return await readFacultyFile(adminEmail);
}

export async function getFacultyByEmail(adminEmail: string, email: string): Promise<Faculty | null> {
    if (!adminEmail) return null;
    const facultyList = await readFacultyFile(adminEmail);
    const faculty = facultyList.find(f => f.email === email);
    return faculty || null;
}

export async function createFaculty(adminEmail: string, data: Faculty): Promise<{ success: boolean; message: string }> {
    const facultyList = await readFacultyFile(adminEmail);

    const existingFaculty = facultyList.find(f => f.email === data.email);
    if (existingFaculty) {
        return { success: false, message: 'A faculty member with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newFaculty = { ...data, password: hashedPassword };

    facultyList.push(newFaculty);

    try {
        await writeFacultyFile(adminEmail, facultyList);
        return { success: true, message: 'Faculty account created successfully.' };
    } catch (error) {
        console.error('Failed to create faculty:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function updateFaculty(adminEmail: string, data: UpdateFacultyData): Promise<{ success: boolean; message: string }> {
    const facultyList = await readFacultyFile(adminEmail);

    const facultyIndex = facultyList.findIndex(f => f.email === data.email);
    if (facultyIndex === -1) {
        return { success: false, message: 'Faculty member not found.' };
    }
    
    const facultyToUpdate = facultyList[facultyIndex];
    facultyToUpdate.name = data.name;
    facultyToUpdate.abbreviation = data.abbreviation;
    facultyToUpdate.department = data.department;
    facultyToUpdate.weeklyMaxHours = data.weeklyMaxHours;
    facultyToUpdate.weeklyOffDays = data.weeklyOffDays || [];


    if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        facultyToUpdate.password = hashedPassword;
    }
    
    facultyList[facultyIndex] = facultyToUpdate;

    try {
        await writeFacultyFile(adminEmail, facultyList);
        return { success: true, message: 'Faculty account updated successfully.' };
    } catch (error) {
        console.error('Failed to update faculty:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function deleteFaculty(adminEmail: string, email: string): Promise<{ success: boolean; message: string }> {
    let facultyList = await readFacultyFile(adminEmail);
    const updatedFacultyList = facultyList.filter(f => f.email !== email);

    if (facultyList.length === updatedFacultyList.length) {
         return { success: false, message: 'Faculty member not found.' };
    }

    try {
        await writeFacultyFile(adminEmail, updatedFacultyList);
        return { success: true, message: 'Faculty account deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete faculty:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function loginFaculty(credentials: LoginData): Promise<{ success: boolean; message: string; adminEmail?: string; }> {
    const adminEmails = await getAdminEmails();

    for (const adminEmail of adminEmails) {
        const facultyList = await readFacultyFile(adminEmail);
        const faculty = facultyList.find(f => f.email === credentials.email);
        if (faculty) {
            const passwordMatch = await bcrypt.compare(credentials.password, faculty.password);
            if (passwordMatch) {
                const forwarded = headers().get('x-forwarded-for');
                const ip = forwarded ? forwarded.split(/, /)[0] : headers().get('x-real-ip');
                await addFacultyLog(adminEmail, faculty.name, faculty.email, 'login', ip ?? undefined);
                return { success: true, message: 'Login successful!', adminEmail };
            }
        }
    }

    return { success: false, message: 'Invalid email or password.' };
}

export async function changeFacultyPassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    const { adminEmail, email, currentPassword, password: newPassword } = data;
    
    if (!adminEmail) {
        return { success: false, message: 'Admin context is missing.' };
    }

    const facultyList = await readFacultyFile(adminEmail);

    const facultyIndex = facultyList.findIndex(f => f.email === email);
    if (facultyIndex === -1) {
        return { success: false, message: 'Faculty member not found.' };
    }
    
    const facultyToUpdate = facultyList[facultyIndex];

    const passwordMatch = await bcrypt.compare(currentPassword, facultyToUpdate.password);
    if (!passwordMatch) {
        return { success: false, message: "Incorrect current password." };
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    facultyToUpdate.password = hashedPassword;
    
    facultyList[facultyIndex] = facultyToUpdate;

    try {
        await writeFacultyFile(adminEmail, facultyList);
        return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
        console.error('Failed to change faculty password:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}
