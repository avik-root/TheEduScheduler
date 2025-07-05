
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { z } from 'zod';
import { LogoSchema } from './validators/auth';

const logoFilePath = path.join(process.cwd(), 'src', 'data', 'logo.json');

export interface AppLogoData {
    dataUrl: string;
}

type LogoData = z.infer<typeof LogoSchema>;

async function readLogoFile(): Promise<AppLogoData | null> {
    try {
        await fs.access(logoFilePath);
        const fileContent = await fs.readFile(logoFilePath, 'utf-8');
        if (!fileContent.trim()) {
            return null;
        }
        const data = JSON.parse(fileContent);
        return data.dataUrl ? data : null;
    } catch (error) {
        return null;
    }
}

async function writeLogoFile(logo: AppLogoData): Promise<void> {
    await fs.mkdir(path.dirname(logoFilePath), { recursive: true });
    await fs.writeFile(logoFilePath, JSON.stringify(logo, null, 2));
}

export async function getLogo(): Promise<string | null> {
    const logoData = await readLogoFile();
    return logoData?.dataUrl || null;
}

export async function updateLogo(data: LogoData): Promise<{ success: boolean; message: string }> {
    try {
        await writeLogoFile({ dataUrl: data.logo });
        return { success: true, message: 'Logo updated successfully.' };
    } catch (error) {
        console.error('Failed to update logo:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
