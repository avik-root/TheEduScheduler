'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { VersionSchema } from '@/lib/validators/auth';
import { revalidatePath } from 'next/cache';

const versionFilePath = path.join(process.cwd(), 'src', 'data', 'version.json');

export type Version = z.infer<typeof VersionSchema>;

async function readVersionFile(): Promise<Version> {
    try {
        await fs.access(versionFilePath);
        const fileContent = await fs.readFile(versionFilePath, 'utf-8');
        if (!fileContent.trim()) {
            return { version: "1.0.0.0", status: "Beta" };
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return { version: "1.0.0.0", status: "Beta" };
    }
}

async function writeVersionFile(version: Version): Promise<void> {
    await fs.mkdir(path.dirname(versionFilePath), { recursive: true });
    await fs.writeFile(versionFilePath, JSON.stringify(version, null, 2));
}

export async function getVersion(): Promise<Version> {
    return await readVersionFile();
}

export async function updateVersion(data: Version): Promise<{ success: boolean; message: string }> {
    try {
        await writeVersionFile(data);
        // Revalidate all paths to reflect the new version number
        revalidatePath('/', 'layout');
        return { success: true, message: 'Version updated successfully.' };
    } catch (error) {
        console.error('Failed to update version:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
