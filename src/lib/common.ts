'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Admin } from '@/lib/admin';

const adminFilePath = path.join(process.cwd(), 'src', 'data', 'admin.json');

async function readAdminsFile(): Promise<Admin[]> {
    try {
        await fs.access(adminFilePath);
        const fileContent = await fs.readFile(adminFilePath, 'utf-8');
        if (!fileContent.trim()) {
            return [];
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

export async function getAdminEmails(): Promise<string[]> {
    const admins = await readAdminsFile();
    return admins.map(admin => admin.email);
}

export function getAdminDataPath(adminEmail: string): string {
    const sanitizedEmail = adminEmail.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(process.cwd(), 'src', 'data', 'admins', sanitizedEmail);
}
