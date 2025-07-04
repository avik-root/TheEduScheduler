'use server';

import fs from 'fs/promises';
import path from 'path';

const developerFilePath = path.join(process.cwd(), 'src', 'data', 'developers.json');

export interface Developer {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatar: string;
    hint: string;
    links: {
        email: string;
        github: string;
        linkedin: string;
    }
}

async function readDevelopersFile(): Promise<Developer[]> {
    try {
        await fs.access(developerFilePath);
        const fileContent = await fs.readFile(developerFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
}

async function writeDevelopersFile(developers: Developer[]): Promise<void> {
    await fs.mkdir(path.dirname(developerFilePath), { recursive: true });
    await fs.writeFile(developerFilePath, JSON.stringify(developers, null, 2));
}

export async function getDevelopers(): Promise<Developer[]> {
    return await readDevelopersFile();
}

export async function updateDeveloper(updatedDeveloper: Developer): Promise<{ success: boolean; message: string }> {
    const developers = await readDevelopersFile();
    const developerIndex = developers.findIndex(dev => dev.id === updatedDeveloper.id);

    if (developerIndex === -1) {
        return { success: false, message: 'Developer not found.' };
    }

    developers[developerIndex] = updatedDeveloper;

    try {
        await writeDevelopersFile(developers);
        return { success: true, message: 'Developer profile updated successfully.' };
    } catch (error) {
        console.error('Failed to update developer profile:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
