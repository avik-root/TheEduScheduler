
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import bcrypt from 'bcryptjs';
import { LoginSchema, SignupSchema, UpdateAdminSchema, Admin2FASchema } from '@/lib/validators/auth';

const adminFilePath = path.join(process.cwd(), 'src', 'data', 'admin.json');
const securityKeysFilePath = path.join(process.cwd(), 'src', 'data', 'security-keys.json');


export type Admin = z.infer<typeof SignupSchema> & {
    isTwoFactorEnabled?: boolean;
    twoFactorPin?: string;
    twoFactorAttempts?: number;
    isLocked?: boolean;
    passwordLastChanged?: string;
};
type UpdateAdminData = z.infer<typeof UpdateAdminSchema>;
type LoginData = z.infer<typeof LoginSchema>;
type Admin2FAData = z.infer<typeof Admin2FASchema>;

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

async function getAdminSecurityKey(): Promise<string | null> {
    try {
        const fileContent = await fs.readFile(securityKeysFilePath, 'utf-8');
        const data = JSON.parse(fileContent);
        return data.adminUnlockKey || null;
    } catch (error) {
        return null;
    }
}

export async function getAdmins(): Promise<Admin[]> {
    return await readAdminsFile();
}

export async function getAdminEmails(): Promise<string[]> {
    const admins = await readAdminsFile();
    return admins.map(admin => admin.email);
}

export async function getFirstAdminEmail(): Promise<string | null> {
    const admins = await readAdminsFile();
    return admins.length > 0 ? admins[0].email : null;
}

export async function getAdminByEmail(email: string): Promise<Admin | null> {
    const admins = await readAdminsFile();
    const admin = admins.find(a => a.email === email);
    return admin || null;
}

export async function createAdmin(data: Admin): Promise<{ success: boolean; message: string }> {
    const admins = await readAdminsFile();

    const existingAdmin = admins.find(admin => admin.email === data.email);
    if (existingAdmin) {
        return { success: false, message: 'An admin with this email already exists.' };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newAdmin: Admin = { 
        ...data, 
        password: hashedPassword,
        isTwoFactorEnabled: false,
        twoFactorAttempts: 0,
        isLocked: false,
        passwordLastChanged: new Date().toISOString()
    };

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
        adminToUpdate.passwordLastChanged = new Date().toISOString();
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
        return { success: false, message: 'An internal error occurred.' };
    }
}

export async function loginAdmin(credentials: LoginData): Promise<{ success: boolean; message: string; requiresTwoFactor?: boolean; isLocked?: boolean; }> {
    const admins = await readAdminsFile();

    if (admins.length === 0) {
        return { success: false, message: 'No admin accounts exist.' };
    }

    const adminIndex = admins.findIndex(a => a.email === credentials.email);
    if (adminIndex === -1) {
         return { success: false, message: 'Invalid email or password.' };
    }
    
    const admin = admins[adminIndex];
    
    if (admin.isLocked) {
        return { success: false, message: 'Account is locked.', isLocked: true };
    }

    const passwordMatch = await bcrypt.compare(credentials.password, admin.password);

    if (passwordMatch) {
        admins[adminIndex].twoFactorAttempts = 0;
        await writeAdminsFile(admins);

        if (admin.isTwoFactorEnabled) {
            return { success: true, message: '2FA required.', requiresTwoFactor: true };
        }
        return { success: true, message: 'Login successful!', requiresTwoFactor: false };
    }
    
    admins[adminIndex].twoFactorAttempts = (admins[adminIndex].twoFactorAttempts || 0) + 1;
    if (admins[adminIndex].twoFactorAttempts >= 5) {
        admins[adminIndex].isLocked = true;
    }
    await writeAdminsFile(admins);
    
    const remaining = 5 - (admins[adminIndex].twoFactorAttempts || 0);
    return { success: false, message: `Invalid email or password. ${remaining} attempt(s) remaining.`, isLocked: admins[adminIndex].isLocked };
}


export async function verifyAdminTwoFactor(email: string, pin: string): Promise<{ success: boolean; message: string; isLocked?: boolean }> {
    const admins = await readAdminsFile();
    const adminIndex = admins.findIndex(a => a.email === email);
    if (adminIndex === -1) {
        return { success: false, message: 'Admin not found.' };
    }
    
    const admin = admins[adminIndex];

    if (admin.isLocked) {
        return { success: false, message: 'Account is locked.', isLocked: true };
    }

    const pinMatch = await bcrypt.compare(pin, admin.twoFactorPin || '');
    if (pinMatch) {
        admins[adminIndex].twoFactorAttempts = 0;
        await writeAdminsFile(admins);
        return { success: true, message: 'Verification successful.' };
    }

    admins[adminIndex].twoFactorAttempts = (admins[adminIndex].twoFactorAttempts || 0) + 1;
    if (admins[adminIndex].twoFactorAttempts >= 5) {
        admins[adminIndex].isLocked = true;
    }
    await writeAdminsFile(admins);
    
    const remaining = 5 - (admins[adminIndex].twoFactorAttempts || 0);
    return { success: false, message: `Incorrect PIN. You have ${remaining} attempt(s) remaining.`, isLocked: admins[adminIndex].isLocked };
}

export async function setAdminTwoFactor(data: Admin2FAData): Promise<{ success: boolean; message: string }> {
    const { email, isEnabled, pin, currentPassword } = data;
    const admins = await readAdminsFile();
    const adminIndex = admins.findIndex(a => a.email === email);

    if (adminIndex === -1) {
        return { success: false, message: 'Admin account not found.' };
    }
    
    const admin = admins[adminIndex];
    
    const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!passwordMatch) {
        return { success: false, message: 'Incorrect password. Settings not saved.' };
    }

    admin.isTwoFactorEnabled = isEnabled;
    if (isEnabled && pin) {
        admin.twoFactorPin = await bcrypt.hash(pin, 10);
    } else if (!isEnabled) {
        admin.twoFactorPin = undefined;
    }

    admins[adminIndex] = admin;

    try {
        await writeAdminsFile(admins);
        return { success: true, message: '2FA settings updated successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to update 2FA settings.' };
    }
}

export async function unlockAdminAccount(email: string, key: string): Promise<{ success: boolean; message: string }> {
    const securityKey = await getAdminSecurityKey();
    if (!securityKey || securityKey !== key) {
        return { success: false, message: 'The provided security key is incorrect.' };
    }

    const admins = await readAdminsFile();
    const adminIndex = admins.findIndex(f => f.email === email);

    if (adminIndex === -1) {
        return { success: false, message: 'Admin account not found.' };
    }

    admins[adminIndex].isLocked = false;
    admins[adminIndex].twoFactorAttempts = 0;
    
    try {
        await writeAdminsFile(admins);
        return { success: true, message: 'Account unlocked successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to unlock account.' };
    }
}
