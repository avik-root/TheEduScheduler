'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { LogoSchema } from '@/lib/validators/auth';
import { revalidatePath } from 'next/cache';

const logoDir = path.join(process.cwd(), 'public', 'logo');
const logoFilename = 'logo.png';
const logoFilePath = path.join(logoDir, logoFilename);
const publicLogoPath = `/logo/${logoFilename}`;

type LogoData = z.infer<typeof LogoSchema>;

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function getLogo(): Promise<string | null> {
    if (await fileExists(logoFilePath)) {
        try {
            const stats = await fs.stat(logoFilePath);
            // Append a timestamp as a query parameter to bust the cache
            return `${publicLogoPath}?t=${stats.mtime.getTime()}`;
        } catch (error) {
            console.error("Failed to get logo file stats:", error);
            // Fallback to path without timestamp if stat fails
            return publicLogoPath;
        }
    }
    return null;
}

export async function updateLogo(data: LogoData): Promise<{ success: boolean; message: string }> {
    try {
        // Ensure the logo directory exists
        await fs.mkdir(logoDir, { recursive: true });

        // Decode the base64 data URL
        const base64Data = data.logo.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Write the new logo file
        await fs.writeFile(logoFilePath, buffer);
        
        // This is important to make Next.js aware of the new static file
        // and to clear any caches related to pages using the logo.
        revalidatePath('/', 'layout'); 

        return { success: true, message: 'Logo updated successfully.' };
    } catch (error) {
        console.error('Failed to update logo:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
