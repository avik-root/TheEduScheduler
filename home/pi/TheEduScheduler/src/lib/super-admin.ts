'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import bcrypt from 'bcryptjs';
import { LoginSchema, SignupSchema, UpdateSuperAdminSchema, SuperAdmin2FASchema } from '@/lib/validators/auth';

const superAdminFilePath = path.join(process.cwd(), 'src', 'data', 'super-admin.json');

type SuperAdmin = z.infer<typeof SignupSchema> & {
    isTwoFactorEnabled?: boolean;
    twoFactorPin?: string;
    twoFactorAttempts?: number;
    isLocked?: boolean;
};
type LoginData = z.infer<typeof LoginSchema>;
type UpdateSuperAdminData = z.infer<typeof UpdateSuperAdminSchema>;
type TwoFactorSettingsData = z.infer<typeof SuperAdmin2FASchema>;


async function readSuperAdminFile(): Promise<SuperAdmin | null> {
    try {
        await fs.mkdir(path.dirname(superAdminFilePath), { recursive: true });
        await fs.access(superAdminFilePath);
        const fileContent = await fs.readFile(superAdminFilePath, 'utf-8');
        if (!fileContent.trim()) {
            return null;
        }
        const data = JSON.parse(fileContent);
        if (Object.keys(data).length === 0) {
            return null;
        }
        return data;
    } catch (error) {
        return null;
    }
}

export async function getSuperAdmin(): Promise<SuperAdmin | null> {
    return await readSuperAdminFile();
}


export async function checkSuperAdminExists(): Promise<boolean> {
    const admin = await readSuperAdminFile();
    return !!admin && !!admin.email;
}


export async function createSuperAdmin(data: Omit<SuperAdmin, 'password'> & { password: string }): Promise<{ success: boolean; message: string }> {
    const exists = await checkSuperAdminExists();
    if (exists) {
        return { success: false, message: 'A super admin account already exists. Sign up is disabled.' };
    }

    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const adminToSave: SuperAdmin = { 
            ...data, 
            password: hashedPassword,
            isTwoFactorEnabled: false,
            twoFactorAttempts: 0,
            isLocked: false
        };

        await fs.writeFile(superAdminFilePath, JSON.stringify(adminToSave, null, 2));
        return { success: true, message: 'Super admin account created successfully.' };
    } catch (error) {
        console.error('Failed to create super admin:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}

export async function loginSuperAdmin(credentials: LoginData): Promise<{ success: boolean; message: string; requiresTwoFactor?: boolean; isLocked?: boolean; }> {
    const admin = await readSuperAdminFile();

    if (!admin || !admin.email) {
        return { success: false, message: 'No super admin account exists. Please sign up.' };
    }
    
    if (admin.isLocked) {
        return { success: false, message: 'Account is locked.', isLocked: true };
    }

    const passwordMatch = await bcrypt.compare(credentials.password, admin.password);

    if (admin.email === credentials.email && passwordMatch) {
        if (admin.isTwoFactorEnabled) {
            return { success: true, message: '2FA required.', requiresTwoFactor: true };
        }
        return { success: true, message: 'Login successful!', requiresTwoFactor: false };
    }
    
    const attempts = (admin.twoFactorAttempts || 0) + 1;
    if (attempts >= 5) {
        admin.isLocked = true;
    }
    admin.twoFactorAttempts = attempts;
    await fs.writeFile(superAdminFilePath, JSON.stringify(admin, null, 2));

    const remaining = 5 - attempts;
    return { success: false, message: 'Invalid email or password.', isLocked: admin.isLocked };
}


export async function verifySuperAdminTwoFactor(email: string, pin: string): Promise<{ success: boolean; message: string; isLocked?: boolean }> {
    const admin = await readSuperAdminFile();
    if (!admin || admin.email !== email) {
        return { success: false, message: 'Invalid session. Please log in again.' };
    }
    if (admin.isLocked) {
        return { success: false, message: 'Account is locked.', isLocked: true };
    }

    const pinMatch = await bcrypt.compare(pin, admin.twoFactorPin || '');
    if (pinMatch) {
        admin.twoFactorAttempts = 0;
        await fs.writeFile(superAdminFilePath, JSON.stringify(admin, null, 2));
        return { success: true, message: 'Verification successful.' };
    }

    const attempts = (admin.twoFactorAttempts || 0) + 1;
    if (attempts >= 5) {
        admin.isLocked = true;
    }
    admin.twoFactorAttempts = attempts;
    await fs.writeFile(superAdminFilePath, JSON.stringify(admin, null, 2));
    
    const remaining = 5 - attempts;
    return { success: false, message: `Incorrect PIN. You have ${remaining} attempt(s) remaining.`, isLocked: admin.isLocked };
}

export async function setSuperAdminTwoFactor(data: TwoFactorSettingsData): Promise<{ success: boolean; message: string }> {
    const { isEnabled, pin, currentPassword } = data;
    const admin = await readSuperAdminFile();

    if (!admin) {
        return { success: false, message: 'Super admin account not found.' };
    }
    
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

    try {
        await fs.writeFile(superAdminFilePath, JSON.stringify(admin, null, 2));
        return { success: true, message: '2FA settings updated successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to update 2FA settings.' };
    }
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
