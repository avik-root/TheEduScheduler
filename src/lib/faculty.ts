
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { FacultySchema, UpdateFacultySchema, LoginSchema, FacultyChangePasswordSchema, TwoFactorSettingsSchema } from '@/lib/validators/auth';
import { getAdminDataPath } from './common';
import { getAdminEmails } from './admin';
import { addFacultyLog } from './logs';
import { headers } from 'next/headers';

const facultyFileName = 'faculty.json';
const securityKeysFilePath = path.join(process.cwd(), 'src', 'data', 'security-keys.json');


export type Faculty = z.infer<typeof FacultySchema>;
type UpdateFacultyData = z.infer<typeof UpdateFacultySchema>;
type LoginData = z.infer<typeof LoginSchema>;
type ChangePasswordData = z.infer<typeof FacultyChangePasswordSchema>;
type TwoFactorSettingsData = z.infer<typeof TwoFactorSettingsSchema> & {
    facultyEmail: string;
    adminEmail: string;
};


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

export async function isFacultyEmailTaken(email: string): Promise<boolean> {
    const adminEmails = await getAdminEmails();
    for (const adminEmail of adminEmails) {
        const facultyList = await readFacultyFile(adminEmail);
        if (facultyList.some(f => f.email === email)) {
            return true;
        }
    }
    return false;
}

export async function isFacultyAbbreviationTaken(abbreviation: string, currentEmail?: string): Promise<boolean> {
    if (!abbreviation) return false;
    const adminEmails = await getAdminEmails();
    const lowerAbbreviation = abbreviation.toLowerCase();
    
    for (const adminEmail of adminEmails) {
        const facultyList = await readFacultyFile(adminEmail);
        if (facultyList.some(f => 
            f.abbreviation && f.abbreviation.toLowerCase() === lowerAbbreviation &&
            (!currentEmail || f.email !== currentEmail)
        )) {
            return true;
        }
    }
    return false;
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
    const isTaken = await isFacultyEmailTaken(data.email);
    if (isTaken) {
        return { success: false, message: 'A faculty member with this email already exists in the system.' };
    }
    
    const isAbbrTaken = await isFacultyAbbreviationTaken(data.abbreviation);
    if (isAbbrTaken) {
        return { success: false, message: 'This abbreviation is already in use.' };
    }


    const facultyList = await readFacultyFile(adminEmail);

    const hashedPassword = await bcryptjs.hash(data.password, 10);
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

    const isAbbrTaken = await isFacultyAbbreviationTaken(data.abbreviation, data.email);
    if (isAbbrTaken) {
        return { success: false, message: 'This abbreviation is already in use by another faculty member.' };
    }
    
    const facultyToUpdate = facultyList[facultyIndex];
    facultyToUpdate.name = data.name;
    facultyToUpdate.abbreviation = data.abbreviation;
    facultyToUpdate.department = data.department;
    facultyToUpdate.weeklyMaxHours = data.weeklyMaxHours;
    facultyToUpdate.weeklyOffDays = data.weeklyOffDays || [];
    
    if (data.password) {
        const hashedPassword = await bcryptjs.hash(data.password, 10);
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
    const facultyList = await readFacultyFile(adminEmail);
    const updatedFacultyList = facultyList.filter(f => f.email !== email);

    if (facultyList.length === updatedFacultyList.length) {
        return { success: false, message: 'Faculty member not found.' };
    }

    try {
        await writeFacultyFile(adminEmail, updatedFacultyList);

        const adminDataPath = await getAdminDataPath(adminEmail);

        const filesToClean = ['subjects.json', 'faculty-logs.json', 'room-requests.json'];

        for (const fileName of filesToClean) {
            const filePath = path.join(adminDataPath, fileName);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                let data = content ? JSON.parse(content) : [];
                
                if (fileName === 'subjects.json') {
                    data = data.map((subject: any) => ({
                        ...subject,
                        facultyEmails: subject.facultyEmails?.filter((e: string) => e !== email) || []
                    }));
                } else {
                    data = data.filter((item: any) => item.facultyEmail !== email);
                }

                await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            } catch (error) {
                // Ignore if file doesn't exist
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                    console.error(`Failed to clean up ${fileName}:`, error);
                }
            }
        }

        return { success: true, message: 'Faculty account and all associated data have been deleted.' };
    } catch (error) {
        console.error('Failed to delete faculty:', error);
        return { success: false, message: 'An internal error occurred during deletion.' };
    }
}

export async function deleteMultipleFaculty(adminEmail: string, emails: string[]): Promise<{ success: boolean; message: string }> {
    let facultyList = await readFacultyFile(adminEmail);
    
    const originalCount = facultyList.length;
    const updatedFacultyList = facultyList.filter(f => !emails.includes(f.email));
    const deletedCount = originalCount - updatedFacultyList.length;

    if (deletedCount === 0) {
        return { success: false, message: 'No matching faculty members found to delete.' };
    }

    try {
        await writeFacultyFile(adminEmail, updatedFacultyList);
        
        const adminDataPath = await getAdminDataPath(adminEmail);
        const filesToClean = ['subjects.json', 'faculty-logs.json', 'room-requests.json'];
        
        for (const fileName of filesToClean) {
            const filePath = path.join(adminDataPath, fileName);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                let data = content ? JSON.parse(content) : [];

                if (fileName === 'subjects.json') {
                    data = data.map((subject: any) => ({
                        ...subject,
                        facultyEmails: subject.facultyEmails?.filter((e: string) => !emails.includes(e)) || []
                    }));
                } else {
                     data = data.filter((item: any) => !emails.includes(item.facultyEmail));
                }
                
                await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            } catch (error) {
                 if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                    console.error(`Failed to clean up ${fileName}:`, error);
                }
            }
        }
        
        const plural = deletedCount > 1 ? 's' : '';
        return { success: true, message: `${deletedCount} faculty account${plural} and associated data deleted successfully.` };
    } catch (error) {
        console.error('Failed to delete multiple faculty:', error);
        return { success: false, message: 'An internal error occurred. Please try again.' };
    }
}


export async function loginFaculty(credentials: LoginData): Promise<{ success: boolean; message: string; adminEmail?: string; requiresTwoFactor?: boolean; show2FADisabledAlert?: boolean; promptFor2FA?: boolean; }> {
    const adminEmails = await getAdminEmails();

    for (const adminEmail of adminEmails) {
        const facultyList = await readFacultyFile(adminEmail);
        const facultyIndex = facultyList.findIndex(f => f.email === credentials.email);
        
        if (facultyIndex !== -1) {
            const faculty = facultyList[facultyIndex];
            
            if (faculty.isLocked) {
                return { success: false, message: 'This account is locked. Please contact an administrator.' };
            }

            const passwordMatch = await bcryptjs.compare(credentials.password, faculty.password);
            
            if (passwordMatch) {
                // Reset attempt counter on successful password login
                facultyList[facultyIndex].twoFactorAttempts = 0;
                
                const show2FADisabledAlert = facultyList[facultyIndex].twoFactorDisabledByAdmin === true;
                if (show2FADisabledAlert) {
                    facultyList[facultyIndex].twoFactorDisabledByAdmin = false; // Reset the flag
                }
                
                await writeFacultyFile(adminEmail, facultyList);
                
                if (faculty.isTwoFactorEnabled) {
                    return { success: true, message: 'Password correct, 2FA required.', adminEmail, requiresTwoFactor: true };
                }

                const forwarded = headers().get('x-forwarded-for');
                const ip = forwarded ? forwarded.split(/, /)[0] : headers().get('x-real-ip');
                await addFacultyLog(adminEmail, faculty.name, faculty.email, 'login', ip ?? undefined);

                return { 
                    success: true, 
                    message: 'Login successful!', 
                    adminEmail, 
                    requiresTwoFactor: false, 
                    show2FADisabledAlert,
                    promptFor2FA: !faculty.isTwoFactorEnabled
                };
            }
        }
    }

    return { success: false, message: 'Invalid email or password.' };
}

export async function verifyTwoFactor(adminEmail: string, facultyEmail: string, pin: string): Promise<{ success: boolean; message: string; isLocked?: boolean }> {
    const facultyList = await readFacultyFile(adminEmail);
    const facultyIndex = facultyList.findIndex(f => f.email === facultyEmail);

    if (facultyIndex === -1) {
        return { success: false, message: 'Faculty member not found.' };
    }
    
    const faculty = facultyList[facultyIndex];
    
    if (faculty.isLocked) {
         return { success: false, message: 'Account is locked.', isLocked: true };
    }

    const pinMatch = await bcryptjs.compare(pin, faculty.twoFactorPin || '');
    if (pinMatch) {
        faculty.twoFactorAttempts = 0;
        await writeFacultyFile(adminEmail, facultyList);

        const forwarded = headers().get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(/, /)[0] : headers().get('x-real-ip');
        await addFacultyLog(adminEmail, faculty.name, faculty.email, 'login', ip ?? undefined);

        return { success: true, message: '2FA verification successful.' };
    }

    // Handle failed attempt
    faculty.twoFactorAttempts = (faculty.twoFactorAttempts || 0) + 1;
    if (faculty.twoFactorAttempts >= 5) {
        faculty.isLocked = true;
        await writeFacultyFile(adminEmail, facultyList);
        return { success: false, message: 'Too many attempts. Account locked.', isLocked: true };
    }
    
    await writeFacultyFile(adminEmail, facultyList);
    const remaining = 5 - faculty.twoFactorAttempts;
    return { success: false, message: `Incorrect PIN. You have ${remaining} attempt(s) remaining.` };
}

export async function setTwoFactor(data: TwoFactorSettingsData): Promise<{ success: boolean; message: string }> {
    const { adminEmail, facultyEmail, isEnabled, pin, currentPassword } = data;
    const facultyList = await readFacultyFile(adminEmail);
    const facultyIndex = facultyList.findIndex(f => f.email === facultyEmail);

    if (facultyIndex === -1) {
        return { success: false, message: 'Faculty member not found.' };
    }

    const faculty = facultyList[facultyIndex];
    
    if (!currentPassword) {
        return { success: false, message: 'Your current password is required to save changes.' };
    }
    
    const passwordMatch = await bcryptjs.compare(currentPassword, faculty.password);
    if (!passwordMatch) {
        return { success: false, message: 'Incorrect password. Settings not saved.' };
    }
    
    faculty.isTwoFactorEnabled = isEnabled;
    if (isEnabled && pin) {
        faculty.twoFactorPin = await bcryptjs.hash(pin, 10);
    } else if (!isEnabled) {
        faculty.twoFactorPin = undefined; // Clear the pin when disabling
    }

    facultyList[facultyIndex] = faculty;

    try {
        await writeFacultyFile(adminEmail, facultyList);
        return { success: true, message: '2FA settings updated successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to update 2FA settings.' };
    }
}

async function getSecurityKey(): Promise<string | null> {
    try {
        const fileContent = await fs.readFile(securityKeysFilePath, 'utf-8');
        const data = JSON.parse(fileContent);
        return data.disableKey || null;
    } catch (error) {
        return null;
    }
}

export async function disableFaculty2FA(adminEmail: string, facultyEmail: string, disableKey: string): Promise<{ success: boolean; message: string }> {
    const securityKey = await getSecurityKey();
    if (!securityKey) {
        return { success: false, message: 'Security key is not configured.' };
    }
    if (securityKey !== disableKey) {
        return { success: false, message: 'The provided security key is incorrect.' };
    }
    
    const facultyList = await readFacultyFile(adminEmail);
    const facultyIndex = facultyList.findIndex(f => f.email === facultyEmail);

    if (facultyIndex === -1) {
        return { success: false, message: 'Faculty member not found.' };
    }

    const faculty = facultyList[facultyIndex];
    faculty.isTwoFactorEnabled = false;
    faculty.isLocked = false;
    faculty.twoFactorAttempts = 0;
    faculty.twoFactorPin = undefined;
    faculty.twoFactorDisabledByAdmin = true; // Set the flag
    
    facultyList[facultyIndex] = faculty;
    
    try {
        await writeFacultyFile(adminEmail, facultyList);
        return { success: true, message: '2FA has been disabled and the account is unlocked.' };
    } catch (error) {
        return { success: false, message: 'Failed to update faculty account.' };
    }
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

    const passwordMatch = await bcryptjs.compare(currentPassword, facultyToUpdate.password);
    if (!passwordMatch) {
        return { success: false, message: "Incorrect current password." };
    }
    
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
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

export async function unlockFacultyAccount(adminEmail: string, facultyEmail: string): Promise<{ success: boolean; message: string }> {
    if (!adminEmail) return { success: false, message: 'Admin not identified.' };
    const facultyList = await readFacultyFile(adminEmail);
    const facultyIndex = facultyList.findIndex(f => f.email === facultyEmail);

    if (facultyIndex === -1) {
        return { success: false, message: 'Faculty member not found.' };
    }

    facultyList[facultyIndex].isLocked = false;
    facultyList[facultyIndex].twoFactorAttempts = 0;
    
    try {
        await writeFacultyFile(adminEmail, facultyList);
        return { success: true, message: 'Account unlocked successfully.' };
    } catch (error) {
        return { success: false, message: 'Failed to unlock account.' };
    }
}
