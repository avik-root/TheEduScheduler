'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import bcrypt from 'bcryptjs';
import { LoginSchema, SignupSchema, UpdateSuperAdminSchema } from '@/lib/validators/auth';

// Define the path to the super admin data file
const superAdminFilePath = path.join(process.cwd(), 'src', 'data', 'super-admin.json');

// Define the type for the super admin data using the existing Zod schema
type SuperAdmin = z.infer<typeof SignupSchema>;
type LoginData = z.infer<typeof LoginSchema>;
type UpdateSuperAdminData = z.infer<typeof UpdateSuperAdminSchema>;


// Helper function to read the super admin file
async function readSuperAdminFile(): Promise<SuperAdmin | null> {
    try {
        // Ensure the data directory exists
        await fs.mkdir(path.dirname(superAdminFilePath), { recursive: true });
        // Check if the file exists before trying to read it
        await fs.access(superAdminFilePath);
        const fileContent = await fs.readFile(superAdminFilePath, 'utf-8');
        // If the file is empty or just whitespace, treat as no admin
        if (!fileContent.trim()) {
            return null;
        }
        const data = JSON.parse(fileContent);
        // Check if the parsed object is empty
        if (Object.keys(data).length === 0) {
            return null;
        }
        return data;
    } catch (error) {
        // If file doesn't exist or other errors, assume no admin exists
        return null;
    }
}

export async function getSuperAdmin(): Promise<SuperAdmin | null> {
    return await readSuperAdminFile();
}

/**
 * Checks if a super admin account exists.
 * @returns {Promise<boolean>} True if a super admin with an email exists, false otherwise.
 */
export async function checkSuperAdminExists(): Promise<boolean> {
    const admin = await readSuperAdminFile();
    // A super admin is considered to exist if there is an object with an 'email' property.
    return !!admin && !!admin.email;
}

/**
 * Creates a new super admin account if one does not already exist.
 * @param {SuperAdmin} data - The data for the new super admin account.
 * @returns {Promise<{ success: boolean; message: string }>} An object indicating success or failure.
 */
export async function createSuperAdmin(data: SuperAdmin): Promise<{ success: boolean; message: string }> {
    const exists = await checkSuperAdminExists();
    if (exists) {
        return { success: false, message: 'A super admin account already exists. Sign up is disabled.' };
    }

    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const adminToSave = { ...data, password: hashedPassword };

        // Write the new admin data to the file
        await fs.writeFile(superAdminFilePath, JSON.stringify(adminToSave, null, 2));
        return { success: true, message: 'Super admin account created successfully.' };
    } catch (error) {
        console.error('Failed to create super admin:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

/**
 * Logs in a super admin by verifying credentials.
 * @param credentials The login data containing email and password.
 * @returns A promise that resolves to an object indicating success and a message.
 */
export async function loginSuperAdmin(credentials: LoginData): Promise<{ success: boolean; message: string }> {
    const admin = await readSuperAdminFile();

    if (!admin || !admin.email) {
        return { success: false, message: 'No super admin account exists. Please sign up.' };
    }

    const passwordMatch = await bcrypt.compare(credentials.password, admin.password);

    if (admin.email === credentials.email && passwordMatch) {
        return { success: true, message: 'Login successful!' };
    }

    return { success: false, message: 'Invalid email or password.' };
}

export async function updateSuperAdmin(data: UpdateSuperAdminData): Promise<{ success: boolean; message: string }> {
    const admin = await readSuperAdminFile();
    if (!admin) {
        return { success: false, message: 'Super admin account not found.' };
    }

    const passwordMatch = await bcrypt.compare(data.currentPassword, admin.password);
    if (!passwordMatch) {
        return { success: false, message: 'Incorrect current password. Changes not saved.' };
    }

    const updatedAdmin = { ...admin };
    updatedAdmin.name = data.name;
    updatedAdmin.email = data.email;

    if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        updatedAdmin.password = hashedPassword;
    }

    try {
        await fs.writeFile(superAdminFilePath, JSON.stringify(updatedAdmin, null, 2));
        return { success: true, message: 'Super admin account updated successfully.' };
    } catch (error) {
        console.error('Failed to update super admin:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}
