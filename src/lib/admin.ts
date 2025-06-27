'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import bcrypt from 'bcrypt';
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

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newAdmin = { ...data, password: hashedPassword };

    admins.push(newAdmin);

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
    
    const adminToUpdate = admins[adminIndex];
    adminToUpdate.name = data.name;

    // Update password only if a new one is provided
    if (data.password) {
        if (!data.currentPassword) {
            return { success: false, message: "The admin's current password is required to make this change." };
        }

        const passwordMatch = await bcrypt.compare(data.currentPassword, adminToUpdate.password);
        if (!passwordMatch) {
            return { success: false, message: "Incorrect current password. Password change not authorized." };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        adminToUpdate.password = hashedPassword;
    }
    
    admins[adminIndex] = adminToUpdate;

    try {
        await writeAdminsFile(admins);
        return { success: true, message: 'Admin account updated successfully.' };
    } catch (error) {
        console.error('Failed to update admin:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function deleteAdmin(email: string, password: string): Promise<{ success: boolean; message: string }> {
    let admins = await readAdminsFile();

    const adminToDelete = admins.find(admin => admin.email === email);
    if (!adminToDelete) {
        return { success: false, message: 'Admin not found.' };
    }

    const passwordMatch = await bcrypt.compare(password, adminToDelete.password);
    if (!passwordMatch) {
        return { success: false, message: 'Incorrect password. Deletion failed.' };
    }

    const updatedAdmins = admins.filter(admin => admin.email !== email);

    try {
        await writeAdminsFile(updatedAdmins);
        return { success: true, message: 'Admin account deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete admin:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}
