'use server';

import fs from 'fs/promises';
import path from 'path';
import { getAdminDataPath } from './common';

const scheduleFileName = 'published-schedule.json';

interface PublishedSchedule {
    content: string;
    publishedAt: string;
}

async function getScheduleFilePath(adminEmail: string): Promise<string> {
    const adminDataPath = await getAdminDataPath(adminEmail);
    await fs.mkdir(adminDataPath, { recursive: true });
    return path.join(adminDataPath, scheduleFileName);
}

async function readScheduleFile(adminEmail: string): Promise<PublishedSchedule | null> {
    try {
        const filePath = await getScheduleFilePath(adminEmail);
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        if (!fileContent.trim()) {
            return null;
        }
        return JSON.parse(fileContent);
    } catch (error) {
        return null;
    }
}

async function writeScheduleFile(adminEmail: string, schedule: PublishedSchedule): Promise<void> {
    const filePath = await getScheduleFilePath(adminEmail);
    await fs.writeFile(filePath, JSON.stringify(schedule, null, 2));
}

export async function publishSchedule(adminEmail: string, scheduleContent: string): Promise<{ success: boolean; message: string }> {
    if (!adminEmail) {
        return { success: false, message: 'Admin email is required.' };
    }
    const schedule: PublishedSchedule = {
        content: scheduleContent,
        publishedAt: new Date().toISOString(),
    };
    try {
        await writeScheduleFile(adminEmail, schedule);
        return { success: true, message: 'Schedule published successfully.' };
    } catch (error) {
        console.error('Failed to publish schedule:', error);
        return { success: false, message: 'An internal error occurred while publishing the schedule.' };
    }
}

export async function getPublishedSchedule(adminEmail: string): Promise<string> {
    if (!adminEmail) return '';
    const schedule = await readScheduleFile(adminEmail);
    return schedule?.content || '';
}

export async function deletePublishedSchedule(adminEmail: string): Promise<{ success: boolean; message: string }> {
    if (!adminEmail) {
        return { success: false, message: 'Admin email is required.' };
    }
    const schedule: PublishedSchedule = {
        content: '',
        publishedAt: '',
    };
    try {
        await writeScheduleFile(adminEmail, schedule);
        return { success: true, message: 'All schedules deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete schedule:', error);
        return { success: false, message: 'An internal error occurred while deleting the schedule.' };
    }
}

export async function deleteSinglePublishedSchedule(adminEmail: string, scheduleTitle: string): Promise<{ success: boolean; message: string }> {
    if (!adminEmail) {
        return { success: false, message: 'Admin email is required.' };
    }
    const scheduleData = await readScheduleFile(adminEmail);
    if (!scheduleData || !scheduleData.content) {
        return { success: false, message: 'No schedule found to delete.' };
    }

    const scheduleParts = ('\n' + scheduleData.content.trim()).split(/\n## /).filter(s => s.trim() !== '');
    const originalCount = scheduleParts.length;

    const updatedParts = scheduleParts.filter(part => !part.trim().startsWith(scheduleTitle));

    if (updatedParts.length === originalCount) {
        return { success: false, message: `Schedule for "${scheduleTitle}" not found.` };
    }

    const newContent = updatedParts.map(part => `## ${part}`).join('\n\n').trim();
    
    const newScheduleData: PublishedSchedule = {
        content: newContent,
        publishedAt: new Date().toISOString(),
    };
    
    try {
        await writeScheduleFile(adminEmail, newScheduleData);
        return { success: true, message: `Schedule for "${scheduleTitle}" deleted successfully.` };
    } catch (error) {
        console.error('Failed to delete single schedule:', error);
        return { success: false, message: 'An internal error occurred.' };
    }
}
