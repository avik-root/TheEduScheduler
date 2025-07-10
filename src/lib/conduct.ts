
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getAdminDataPath } from './common';
import { format, isSameDay, parse } from 'date-fns';

const conductStatusFileName = 'conduct-status.json';

export interface ConductLogEntry {
    classKey: string; // Unique key for the class slot (e.g., Program-Section-Day-Time)
    facultyEmail: string;
    date: string; // YYYY-MM-DD format
    status: 'conducted' | 'not-conducted';
}

async function getConductLogFilePath(adminEmail: string): Promise<string> {
    const adminDataPath = await getAdminDataPath(adminEmail);
    await fs.mkdir(adminDataPath, { recursive: true });
    return path.join(adminDataPath, conductStatusFileName);
}

async function readConductLogFile(adminEmail: string): Promise<ConductLogEntry[]> {
    try {
        const filePath = await getConductLogFilePath(adminEmail);
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return fileContent ? JSON.parse(fileContent) : [];
    } catch (error) {
        return [];
    }
}

async function writeConductLogFile(adminEmail: string, log: ConductLogEntry[]): Promise<void> {
    const filePath = await getConductLogFilePath(adminEmail);
    await fs.writeFile(filePath, JSON.stringify(log, null, 2));
}

export async function setConductStatus(adminEmail: string, entry: Omit<ConductLogEntry, 'date'> & { date: Date }): Promise<{ success: boolean; message: string }> {
    if (!adminEmail) return { success: false, message: 'Admin not specified.' };

    const logs = await readConductLogFile(adminEmail);
    const formattedDate = format(entry.date, 'yyyy-MM-dd');

    const newLogEntry: ConductLogEntry = { ...entry, date: formattedDate };

    const entryIndex = logs.findIndex(log => 
        log.classKey === entry.classKey && 
        log.date === formattedDate &&
        log.facultyEmail === entry.facultyEmail
    );

    if (entryIndex !== -1) {
        logs[entryIndex] = newLogEntry;
    } else {
        logs.push(newLogEntry);
    }
    
    // Optional: Clean up old logs (e.g., older than 30 days) to keep the file size manageable
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = logs.filter(log => new Date(log.date) >= thirtyDaysAgo);

    try {
        await writeConductLogFile(adminEmail, recentLogs);
        return { success: true, message: 'Status updated.' };
    } catch (error) {
        console.error("Failed to set conduct status:", error);
        return { success: false, message: 'Failed to update status.' };
    }
}

export async function getConductLogForDay(adminEmail: string, date: Date): Promise<ConductLogEntry[]> {
    if (!adminEmail) return [];
    const logs = await readConductLogFile(adminEmail);
    const formattedDate = format(date, 'yyyy-MM-dd');
    return logs.filter(log => log.date === formattedDate);
}
