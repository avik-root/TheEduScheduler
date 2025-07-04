
'use server';

import fs from 'fs/promises';
import path from 'path';

const developerFilePath = path.join(process.cwd(), 'src', 'data', 'developers.json');
const pageContentFilePath = path.join(process.cwd(), 'src', 'data', 'developer-page-content.json');


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

export interface DeveloperPageContent {
    aboutTitle: string;
    aboutDescription: string;
    teamTitle: string;
    teamDescription: string;
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

async function readPageContentFile(): Promise<DeveloperPageContent> {
    try {
        await fs.access(pageContentFilePath);
        const fileContent = await fs.readFile(pageContentFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // Return default content if file doesn't exist or is empty
        return {
            aboutTitle: "About MintFire",
            aboutDescription: "At MintFire, we believe in the power of intelligent automation to solve complex problems. We are a passionate team of developers and engineers dedicated to creating innovative solutions that are both powerful and user-friendly. Our flagship product, EduScheduler, is a testament to this commitment, revolutionizing academic scheduling with cutting-edge AI.",
            teamTitle: "Meet the Team",
            teamDescription: "The minds behind"
        };
    }
}

async function writePageContentFile(content: DeveloperPageContent): Promise<void> {
    await fs.mkdir(path.dirname(pageContentFilePath), { recursive: true });
    await fs.writeFile(pageContentFilePath, JSON.stringify(content, null, 2));
}

export async function getDeveloperPageContent(): Promise<DeveloperPageContent> {
    return await readPageContentFile();
}

export async function updateDeveloperPageContent(content: DeveloperPageContent): Promise<{ success: boolean; message: string }> {
    try {
        await writePageContentFile(content);
        return { success: true, message: 'Developer page content updated successfully.' };
    } catch (error) {
        console.error('Failed to update page content:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
