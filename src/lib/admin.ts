'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { SignupSchema, UpdateAdminSchema } from '@/lib/validators/auth';

const adminFilePath = path.join(process.cwd(), 'src', 'data', 'admin.json');

export type Admin = z.infer<typeof SignupSchema>;
type UpdateAdminData = z.infer<typeof UpdateAdminSchema>;

async function readAdminsFile(): Promise<Admin[]> {
    try {
        await fs.access(adminFilePath);
        const fileContent = await fs.readFile(adminFilePath, 'utf-8');
        if (!fileContent.trim()) {
            return [];
        }
        return JSON.parse(fileContent);
    } catch (error) {
        // If file doesn't exist, return an empty array
        return [];
    }
}

async function writeAdminsFile(admins: Admin[]): Promise<void> {
    await fs.mkdir(path.dirname(adminFilePath), { recursive: true });
    await fs.writeFile(adminFilePath, JSON.stringify(admins, null, 2));
}

export async function getAdmins(): Promise<Admin[]> {
    return await readAdminsFile();
}

export async function createAdmin(data: Admin): Promise<{ success: boolean; message: string }> {
    const admins = await readAdminsFile();

    const existingAdmin = admins.find(admin => admin.email === data.email);
    if (existingAdmin) {
        return { success: false, message: 'An admin with this email already exists.' };
    }

    admins.push(data);

    try {
        await writeAdminsFile(admins);
        return { success: true, message: 'Admin account created successfully.' };
    } catch (error) {
        console.error('Failed to create admin:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function updateAdmin(data: UpdateAdminData): Promise<{ success: boolean; message: string }> {
    const admins = await readAdminsFile();

    const adminIndex = admins.findIndex(admin => admin.email === data.email);
    if (adminIndex === -1) {
        return { success: false, message: 'Admin not found.' };
    }
    
    // Update name
    admins[adminIndex].name = data.name;

    // Update password only if a new one is provided
    if (data.password) {
        admins[adminIndex].password = data.password;
    }

    try {
        await writeAdminsFile(admins);
        return { success: true, message: 'Admin account updated successfully.' };
    } catch (error) {
        console.error('Failed to update admin:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}
